type ResizeApplyMsg = {
    type: "RESIZE_APPLY";
    payload: {
        width: number;
        height?: number;
    };
};

type ResizeResetMsg = { type: "RESIZE_RESET" };

type BgMsg = ResizeApplyMsg | ResizeResetMsg;

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
): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.debugger.sendCommand({ tabId }, method, params, () => {
            const err = chrome.runtime.lastError;
            if (err) return reject(new Error(err.message));
            resolve();
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

async function getCurrentHeight(tabId: number): Promise<number> {
    // Avoid needing scripting permission: use chrome.tabs API
    const tab = await chrome.tabs.get(tabId);
    const h = Number(tab.height);
    if (Number.isFinite(h) && h > 0) return Math.floor(h);
    return 800;
}

async function applyResize(tabId: number, width: number, height?: number): Promise<void> {
    const w = Math.max(1, Math.floor(width));
    const h =
        typeof height === "number" && Number.isFinite(height) && height > 0
            ? Math.floor(height)
            : await getCurrentHeight(tabId);

    await dbgAttach(tabId);

    await dbgSend(tabId, "Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 0,
        mobile: false,
    });

    await dbgSend(tabId, "Emulation.setVisibleSize", {
        width: w,
        height: h,
    });
}

async function resetResize(tabId: number): Promise<void> {
    await dbgAttach(tabId);
    await dbgSend(tabId, "Emulation.clearDeviceMetricsOverride", {});
    await dbgDetach(tabId);
}

chrome.runtime.onMessage.addListener((msg: BgMsg, _sender, sendResponse) => {
    (async () => {
        if (msg?.type === "RESIZE_APPLY") {
            const tabId = await getActiveTabId();
            await applyResize(tabId, msg.payload.width, msg.payload.height);
            sendResponse({ ok: true });
            return;
        }

        if (msg?.type === "RESIZE_RESET") {
            const tabId = await getActiveTabId();
            await resetResize(tabId);
            sendResponse({ ok: true });
            return;
        }

        sendResponse({ ok: false, error: "Unknown message" });
    })().catch((e) => {
        sendResponse({ ok: false, error: String(e) });
    });

    return true;
});
