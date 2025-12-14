import * as React from "react";
import { getBreakpointName, TW_BREAKPOINTS, type EmulationState } from "../shared/breakpoints";

type Props = {
    state: EmulationState;
    onHide: () => void;
    onApplyWidth: (width: number) => void;
    onReset: () => void;
};

export function ResponsiveToolbar({
    state,
    onHide,
    onApplyWidth,
    onReset,
}: Props): React.JSX.Element | null {
    if (!state.active || !state.width || !state.height) return null;

    const bp = getBreakpointName(state.width);
    const scale = typeof state.scale === "number" ? state.scale : 1;

    return (
        <div className="fixed left-0 top-0 z-2147483647 w-full select-none">
            <div className="mx-auto mt-2 w-[min(1100px,calc(100%-16px))] rounded-2xl border border-white/10 bg-black/75 px-3 py-2 text-white shadow-lg backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                            {state.width} × {state.height}
                        </span>
                        <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium">
                            {bp}
                        </span>
                        <span className="text-xs opacity-70 tabular-nums">
                            scale {scale.toFixed(3)}
                        </span>
                    </div>

                    <div className="mx-2 h-5 w-px bg-white/10" />

                    <div className="flex flex-wrap gap-2">
                        {TW_BREAKPOINTS.map((b) => (
                            <button
                                key={b.name}
                                onClick={() => onApplyWidth(b.min)}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                                title={`Apply ${b.name} (${b.min})`}
                            >
                                {b.name} {b.min}
                            </button>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={onReset}
                            className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
                            title="Reset emulation (also removes the debug infobar)"
                        >
                            Reset
                        </button>

                        <button
                            onClick={onHide}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                            title="Hide this overlay"
                        >
                            Hide
                        </button>
                    </div>
                </div>

                <div className="mt-1 text-[11px] opacity-60">
                    If Chrome’s Device Toolbar is enabled, its numbers can be misleading. Use this
                    overlay as the source of truth.
                </div>
            </div>
        </div>
    );
}
