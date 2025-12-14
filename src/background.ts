type ResizeApplyMsg = {
    type: "RESIZE_APPLY";
    payload: { width: number; height?: number };
};
type ResizeResetMsg = { type: "RESIZE_RESET" };
type BgMsg = ResizeApplyMsg | ResizeResetMsg;

const attachedTabs = new Set<number>();

function log(...args: unknown[]) {
    console.log("[tw-resize]", ...args);
}

function dbgAttach(tabId: number): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.debugger.attach({ tabId }, "1.3", () => {
            const err = chrome.runtime.lastError;
            if (err) return reject(new Error(err.message));
            resolve();
        });
    });
}

function dbgSend<TParams extends object>(
    tabId: number,
    method: string,
    params: TParams,
): Promise<any> {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId }, method, params, (res) => {
            const err = chrome.runtime.lastError;
            if (err) return reject(new Error(err.message));
            resolve(res);
        });
    });
}

function dbgDetach(tabId: number): Promise<void> {
    return new Promise((resolve) => {
        chrome.debugger.detach({ tabId }, () => resolve());
    });
}

async function getActiveTabId(): Promise<number> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");
    return tab.id;
}

async function sendToTab(tabId: number, msg: unknown): Promise<void> {
    try {
        await chrome.tabs.sendMessage(tabId, msg);
    } catch (e) {
        // Content script may not exist on restricted pages
        log("sendToTab failed (likely restricted page)", String(e));
    }
}

async function ensureAttached(tabId: number): Promise<void> {
    if (attachedTabs.has(tabId)) return;
    await dbgAttach(tabId);
    attachedTabs.add(tabId);
}

async function hardResetDebugger(tabId: number): Promise<void> {
    try {
        await ensureAttached(tabId);
        await dbgSend(tabId, "Emulation.clearDeviceMetricsOverride", {});
    } catch {
        // ignore
    }

    try {
        await dbgDetach(tabId);
    } catch {
        // ignore
    }

    attachedTabs.delete(tabId);
}

async function getViewportSize(tabId: number): Promise<{ w: number; h: number }> {
    const metrics = await dbgSend(tabId, "Page.getLayoutMetrics", {});
    const w = Number(metrics?.cssLayoutViewport?.clientWidth);
    const h = Number(metrics?.cssLayoutViewport?.clientHeight);

    return {
        w: Number.isFinite(w) && w > 0 ? Math.floor(w) : 1200,
        h: Number.isFinite(h) && h > 0 ? Math.floor(h) : 800,
    };
}

async function applyResize(
    tabId: number,
    width: number,
    height?: number,
): Promise<{ w: number; h: number; scale: number; positionX: number }> {
    // If already active, do exactly what you asked: cancel debug first, then start fresh
    if (attachedTabs.has(tabId)) {
        log("apply: already active -> hard reset then reapply");
        await hardResetDebugger(tabId);
    }

    await ensureAttached(tabId);
    await dbgSend(tabId, "Page.enable", {});

    const current = await getViewportSize(tabId);

    const requestedW = Math.max(1, Math.floor(width));
    const requestedH =
        typeof height === "number" && Number.isFinite(height) && height > 0
            ? Math.floor(height)
            : current.h;

    // Fit-to-window (DevTools-style) if requested width is wider than window
    const scale = Math.min(1, current.w / requestedW);

    // Centre viewport when smaller (reduces that ugly theme-colour slab)
    const scaledViewportW = Math.floor(requestedW * scale);
    const positionX =
        scaledViewportW < current.w ? Math.floor((current.w - scaledViewportW) / 2) : 0;

    log("apply", { current, requestedW, requestedH, scale, positionX });

    await dbgSend(tabId, "Emulation.setDeviceMetricsOverride", {
        width: requestedW,
        height: requestedH,
        deviceScaleFactor: 0,
        mobile: false,

        // Fit + centring
        scale,
        positionX,
        positionY: 0,

        // Helps some pages behave consistently
        screenWidth: requestedW,
        screenHeight: requestedH,
    });

    return { w: requestedW, h: requestedH, scale, positionX };
}

async function resetResize(tabId: number): Promise<void> {
    await hardResetDebugger(tabId);
}

chrome.debugger.onDetach.addListener((source, reason) => {
    const tabId = source.tabId;
    if (typeof tabId === "number") {
        attachedTabs.delete(tabId);
        log("debugger detached", { tabId, reason });
        // Ensure toolbar disappears if detach happens unexpectedly
        void sendToTab(tabId, { type: "EMULATION_STATE", state: { active: false, reason } });
    }
});

chrome.runtime.onMessage.addListener((msg: BgMsg, _sender, sendResponse) => {
    (async () => {
        log("msg", msg);

        if (msg?.type === "RESIZE_APPLY") {
            const tabId = await getActiveTabId();
            const r = await applyResize(tabId, msg.payload.width, msg.payload.height);

            await sendToTab(tabId, {
                type: "EMULATION_STATE",
                state: {
                    active: true,
                    width: r.w,
                    height: r.h,
                    scale: r.scale,
                    positionX: r.positionX,
                },
            });

            sendResponse({ ok: true });
            return;
        }

        if (msg?.type === "RESIZE_RESET") {
            const tabId = await getActiveTabId();
            await resetResize(tabId);

            await sendToTab(tabId, { type: "EMULATION_STATE", state: { active: false } });

            sendResponse({ ok: true });
            return;
        }

        sendResponse({ ok: false, error: "Unknown message" });
    })().catch((e) => {
        log("error", e);
        sendResponse({ ok: false, error: String(e) });
    });

    return true;
});
