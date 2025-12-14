import * as React from "react";
import { createRoot } from "react-dom/client";
import "./styles/tailwind.css";

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

function App(): React.JSX.Element {
    const [width, setWidth] = React.useState<number>(BPS[0].w);
    const [height, setHeight] = React.useState<string>("");
    const [overlayVisible, setOverlayVisible] = React.useState<boolean | null>(null);
    const [status, setStatus] = React.useState<string>("");

    React.useEffect(() => {
        (async () => {
            try {
                const res = await sendToActiveTab<OverlayResponse>({ type: "OVERLAY_GET_STATE" });
                if (res?.ok) setOverlayVisible(res.visible);
            } catch {
                setStatus("Overlay not available on this page");
            }
        })();
    }, []);

    async function apply(): Promise<void> {
        setStatus("");
        try {
            const raw = height.trim();
            const parsed = Number(raw);

            const payload =
                raw === ""
                    ? { width }
                    : {
                          width,
                          height:
                              Number.isFinite(parsed) && parsed > 0
                                  ? Math.floor(parsed)
                                  : undefined,
                      };

            const res = await sendToBackground<BgResponse>({ type: "RESIZE_APPLY", payload });
            if (!res.ok) throw new Error(res.error || "Resize failed");
            setStatus("Applied");
        } catch (e) {
            setStatus(String(e));
        }
    }

    async function reset(): Promise<void> {
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
        } catch {
            setOverlayVisible(null);
            setStatus("Overlay not available on this page");
        }
    }

    return (
        <div className="w-[320px] bg-neutral-950 p-3 text-neutral-100">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold">Tailwind breakpoints</div>

                <div className="mt-2 flex flex-wrap gap-2">
                    {BPS.map((bp) => (
                        <button
                            key={bp.name}
                            onClick={() => setWidth(bp.w)}
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

                <div className="mt-3">
                    <div className="mb-1 text-xs opacity-80">Height (px, optional)</div>
                    <input
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="blank = keep current height"
                        className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-white/20"
                    />
                </div>

                <div className="mt-3 flex gap-2">
                    <button
                        onClick={apply}
                        className="flex-1 rounded-xl bg-white/15 px-4 py-2 text-sm hover:bg-white/20"
                    >
                        Apply
                    </button>
                    <button
                        onClick={reset}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
                    >
                        Reset
                    </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <button
                        onClick={toggleOverlay}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                    >
                        Overlay: {overlayVisible === null ? "?" : overlayVisible ? "On" : "Off"}
                    </button>
                </div>

                {status ? <div className="mt-2 text-xs opacity-80">{status}</div> : null}
                <div className="mt-2 text-[11px] opacity-60">
                    Resizing uses Chrome DevTools Protocol, so you may see a debugging infobar.
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
