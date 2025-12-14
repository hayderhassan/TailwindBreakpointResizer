import * as React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";

import { getViewportFromActiveTab } from "./shared/getCurrentViewport";
import { ASPECT_RATIOS, heightFromRatio, matchRatio, type AspectRatio } from "./shared/resizeModel";

const BPS = [
    { name: "sm", w: 640 },
    { name: "md", w: 768 },
    { name: "lg", w: 1024 },
    { name: "xl", w: 1280 },
    { name: "2xl", w: 1536 },
] as const;

type BgResponse = { ok: boolean; error?: string };
type OverlayResponse = { ok: boolean; visible: boolean };

async function getActiveTabId(): Promise<number> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active tab");
    return tab.id;
}

async function sendToBackground<T>(msg: unknown): Promise<T> {
    return (await chrome.runtime.sendMessage(msg)) as T;
}

async function sendToActiveTab<T>(msg: unknown): Promise<T> {
    const tabId = await getActiveTabId();
    return (await chrome.tabs.sendMessage(tabId, msg)) as T;
}

function findRatioByLabel(label: string): AspectRatio {
    return ASPECT_RATIOS.find((r) => r.label === label) ?? ASPECT_RATIOS[0];
}

function App(): React.JSX.Element {
    // Resize controls
    const [width, setWidth] = React.useState<number>(BPS[0].w);
    const [height, setHeight] = React.useState<number>(800);
    const [ratio, setRatio] = React.useState<AspectRatio>(ASPECT_RATIOS[0]); // None by default

    // Overlay toggle
    const [overlayVisible, setOverlayVisible] = React.useState<boolean | null>(null);

    // UX state
    const [status, setStatus] = React.useState<string>("");
    const [editingHeight, setEditingHeight] = React.useState(false);

    // Initialise from current viewport when popup opens
    React.useEffect(() => {
        (async () => {
            try {
                const vp = await getViewportFromActiveTab();
                setWidth(vp.width);
                setHeight(vp.height);
                setRatio(matchRatio(vp.width, vp.height));
            } catch {
                // ignore
            }

            try {
                const res = await sendToActiveTab<OverlayResponse>({ type: "OVERLAY_GET_STATE" });
                if (res?.ok) setOverlayVisible(res.visible);
                else setOverlayVisible(null);
            } catch {
                setOverlayVisible(null);
            }
        })();
    }, []);

    // Keep height input synced to current page height while popup is open.
    // If a ratio is selected, we do NOT overwrite height (ratio owns it).
    React.useEffect(() => {
        if (editingHeight) return;

        const id = window.setInterval(async () => {
            if (editingHeight) return;
            if (ratio.w && ratio.h) return; // ratio-selected: height is derived

            const vp = await getViewportFromActiveTab();
            // Only update if changed to avoid churn
            if (vp.height !== height) {
                setHeight(vp.height);
                setRatio(matchRatio(width, vp.height));
            }
        }, 300);

        return () => window.clearInterval(id);
    }, [editingHeight, ratio, width, height]);

    function applyWidth(nextWidth: number) {
        setWidth(nextWidth);

        if (ratio.w && ratio.h) {
            const nextHeight = heightFromRatio(nextWidth, ratio);
            setHeight(nextHeight);
            // ratio stays as-is
            return;
        }

        // If ratio is None, keep current height but re-infer ratio match
        setRatio(matchRatio(nextWidth, height));
    }

    function applyHeight(nextHeight: number, source: "user" | "page") {
        setHeight(nextHeight);

        // If height is user-entered or taken from page, ratio becomes None unless it matches
        const inferred = matchRatio(width, nextHeight);
        setRatio(inferred);
    }

    function applyRatio(next: AspectRatio) {
        setRatio(next);

        if (next.w && next.h) {
            const nextHeight = heightFromRatio(width, next);
            setHeight(nextHeight);
        } else {
            // None selected: height should reflect current page height (kept via polling)
            // also infer match from current height (will usually be None)
            setRatio(matchRatio(width, height));
        }
    }

    async function onApply(): Promise<void> {
        setStatus("");

        try {
            const res = await sendToBackground<BgResponse>({
                type: "RESIZE_APPLY",
                payload: { width, height },
            });

            if (!res.ok) throw new Error(res.error || "Resize failed");
            setStatus("Applied");
        } catch (e) {
            setStatus(String(e));
        }
    }

    async function onReset(): Promise<void> {
        setStatus("");

        try {
            const res = await sendToBackground<BgResponse>({ type: "RESIZE_RESET" });
            if (!res.ok) throw new Error(res.error || "Reset failed");
            setStatus("Reset");
        } catch (e) {
            setStatus(String(e));
        }
    }

    async function toggleOverlay(): Promise<void> {
        setStatus("");

        try {
            const res = await sendToActiveTab<OverlayResponse>({ type: "OVERLAY_TOGGLE" });
            if (res?.ok) setOverlayVisible(res.visible);
            else setOverlayVisible(null);
        } catch {
            setOverlayVisible(null);
            setStatus("Overlay not available on this page");
        }
    }

    return (
        <div className="w-[340px] bg-neutral-950 p-3 text-neutral-100">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">TW Resize</div>
                    <button
                        onClick={toggleOverlay}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                    >
                        Overlay: {overlayVisible === null ? "?" : overlayVisible ? "On" : "Off"}
                    </button>
                </div>

                <div className="mt-3 text-xs opacity-80">Width (breakpoints)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                    {BPS.map((bp) => (
                        <button
                            key={bp.name}
                            onClick={() => applyWidth(bp.w)}
                            className={[
                                "rounded-xl border px-3 py-2 text-sm",
                                width === bp.w
                                    ? "border-white/20 bg-white/15"
                                    : "border-white/10 bg-white/5 hover:bg-white/10",
                            ].join(" ")}
                        >
                            {bp.name} ({bp.w})
                        </button>
                    ))}
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="block">
                        <div className="mb-1 text-xs opacity-80">Height (px)</div>
                        <input
                            value={String(height)}
                            onFocus={() => setEditingHeight(true)}
                            onBlur={async () => {
                                setEditingHeight(false);
                                // On blur, if ratio is None, snap back to current page height (authoritative)
                                if (!ratio.w && !ratio.h) {
                                    const vp = await getViewportFromActiveTab();
                                    applyHeight(vp.height, "page");
                                }
                            }}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                if (Number.isFinite(v) && v > 0) applyHeight(Math.floor(v), "user");
                            }}
                            inputMode="numeric"
                            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-white/20"
                        />
                    </label>

                    <label className="block">
                        <div className="mb-1 text-xs opacity-80">Aspect ratio</div>
                        <select
                            value={ratio.label}
                            onChange={(e) => applyRatio(findRatioByLabel(e.target.value))}
                            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-white/20"
                        >
                            {ASPECT_RATIOS.map((r) => (
                                <option key={r.label} value={r.label}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="mt-3 flex gap-2">
                    <button
                        onClick={onApply}
                        className="flex-1 rounded-xl bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/20"
                    >
                        Apply
                    </button>
                    <button
                        onClick={onReset}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                    >
                        Reset
                    </button>
                </div>

                {status ? <div className="mt-2 text-xs opacity-80">{status}</div> : null}
                <div className="mt-2 text-[11px] opacity-60">
                    Note: resizing uses the DevTools protocol, so Chrome shows a debugging infobar
                    while active.
                </div>
            </div>
        </div>
    );
}

createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
