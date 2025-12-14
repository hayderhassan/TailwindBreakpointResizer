import * as React from "react";
import { createRoot } from "react-dom/client";
import { TW_BREAKPOINTS } from "./shared/breakpoints";
import "./styles/tailwind.css";

type AspectRatio = { label: string; w: number; h: number };

const RATIOS: AspectRatio[] = [
    { label: "None", w: 0, h: 0 },
    { label: "16:9", w: 16, h: 9 },
    { label: "4:3", w: 4, h: 3 },
    { label: "3:2", w: 3, h: 2 },
    { label: "21:9", w: 21, h: 9 },
    { label: "1:1", w: 1, h: 1 },
    { label: "9:16", w: 9, h: 16 },
];

async function getCurrentHeightFromPage(): Promise<number> {
    const expr = "window.innerHeight";
    const res = await new Promise<{ value?: number }>((resolve) => {
        chrome.devtools.inspectedWindow.eval(expr, (value) => resolve({ value }));
    });

    const h = Number(res.value);
    return Number.isFinite(h) && h > 0 ? Math.floor(h) : 800;
}

async function attach(tabId: number): Promise<void> {
    await chrome.debugger.attach({ tabId }, "1.3");
}

async function detach(tabId: number): Promise<void> {
    try {
        await chrome.debugger.detach({ tabId });
    } catch {
        // ignore
    }
}

async function send(tabId: number, method: string, params: object): Promise<void> {
    await chrome.debugger.sendCommand({ tabId }, method, params);
}

async function applyMetrics(width: number, height: number): Promise<void> {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    await attach(tabId);

    await send(tabId, "Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 0,
        mobile: false,
    });

    await send(tabId, "Emulation.setVisibleSize", { width, height });
}

async function resetMetrics(): Promise<void> {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    await attach(tabId);
    await send(tabId, "Emulation.clearDeviceMetricsOverride", {});
    await detach(tabId);
}

function App(): React.JSX.Element {
    const [selectedWidth, setSelectedWidth] = React.useState<number>(TW_BREAKPOINTS[0].min);
    const [heightPx, setHeightPx] = React.useState<string>("");
    const [ratio, setRatio] = React.useState<AspectRatio>(RATIOS[0]);
    const [busy, setBusy] = React.useState(false);
    const [status, setStatus] = React.useState<string>("");

    async function onApply() {
        setBusy(true);
        setStatus("");

        try {
            const width = Math.floor(selectedWidth);

            const parsedHeight = Number(heightPx);
            const hasHeight =
                heightPx.trim() !== "" && Number.isFinite(parsedHeight) && parsedHeight > 0;

            let height: number;

            if (hasHeight) {
                height = Math.floor(parsedHeight);
            } else if (ratio.w > 0 && ratio.h > 0) {
                height = Math.max(1, Math.floor((width * ratio.h) / ratio.w));
            } else {
                height = await getCurrentHeightFromPage();
            }

            await applyMetrics(width, height);
            setStatus(`Applied ${width}×${height}`);
        } catch (e) {
            setStatus(`Failed: ${String(e)}`);
        } finally {
            setBusy(false);
        }
    }

    async function onReset() {
        setBusy(true);
        setStatus("");

        try {
            await resetMetrics();
            setStatus("Reset to normal");
        } catch (e) {
            setStatus(`Failed: ${String(e)}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 p-3 text-neutral-100">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">Tailwind breakpoints</div>

                <div className="mt-3 flex flex-wrap gap-2">
                    {TW_BREAKPOINTS.map((bp) => (
                        <button
                            key={bp.name}
                            onClick={() => setSelectedWidth(bp.min)}
                            className={[
                                "rounded-xl border px-3 py-2 text-sm",
                                selectedWidth === bp.min
                                    ? "border-white/20 bg-white/15"
                                    : "border-white/10 bg-white/5 hover:bg-white/10",
                            ].join(" ")}
                            disabled={busy}
                        >
                            {bp.name} ({bp.min})
                        </button>
                    ))}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3">
                    <label className="block">
                        <div className="mb-1 text-xs opacity-80">Height (px) overrides ratio</div>
                        <input
                            value={heightPx}
                            onChange={(e) => setHeightPx(e.target.value)}
                            inputMode="numeric"
                            placeholder="Leave blank to keep current height"
                            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-white/20"
                            disabled={busy}
                        />
                    </label>

                    <label className="block">
                        <div className="mb-1 text-xs opacity-80">
                            Aspect ratio (used only if height is blank)
                        </div>
                        <select
                            value={ratio.label}
                            onChange={(e) => {
                                const next =
                                    RATIOS.find((r) => r.label === e.target.value) ?? RATIOS[0];
                                setRatio(next);
                            }}
                            className="w-full rounded-xl border border-white/10 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-white/20"
                            disabled={busy}
                        >
                            {RATIOS.map((r) => (
                                <option key={r.label} value={r.label}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onApply}
                        className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium hover:bg-white/20 disabled:opacity-60"
                        disabled={busy}
                    >
                        Apply
                    </button>
                    <button
                        onClick={onReset}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-60"
                        disabled={busy}
                    >
                        Reset
                    </button>
                </div>

                {status ? <div className="mt-3 text-xs opacity-80">{status}</div> : null}

                <div className="mt-3 text-xs opacity-60">
                    Note: Chrome shows a “debugging” infobar while emulation is active.
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
