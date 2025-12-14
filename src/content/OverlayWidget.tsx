import * as React from "react";
import { getBreakpointName } from "../shared/breakpoints";

type Size = { w: number; h: number };

function useViewportSize(): Size {
    const [size, setSize] = React.useState<Size>(() => ({
        w: window.innerWidth,
        h: window.innerHeight,
    }));

    React.useEffect(() => {
        const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener("resize", onResize, { passive: true });
        return () => window.removeEventListener("resize", onResize);
    }, []);

    return size;
}

export function OverlayWidget(): React.JSX.Element {
    const { w, h } = useViewportSize();
    const bp = getBreakpointName(w);

    return (
        <div className="fixed bottom-3 left-3 z-2147483647 select-none">
            <div className="rounded-xl border border-white/10 bg-black/75 px-3 py-2 text-white shadow-lg backdrop-blur">
                <div className="text-xs opacity-80">Viewport</div>
                <div className="text-sm font-semibold tabular-nums">
                    {w} × {h}
                </div>
                <div className="mt-1 inline-flex items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium">
                        {bp}
                    </span>
                    <span className="text-xs opacity-70">
                        dpr {Number(window.devicePixelRatio || 1).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
}
