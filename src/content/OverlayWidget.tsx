import * as React from "react";
import { getBreakpointName, type EmulationState } from "../shared/breakpoints";
import { ResponsiveToolbar } from "./ResponsiveToolbar";

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

type Props = {
    emulation: EmulationState;
    overlayVisible: boolean;
    toolbarVisible: boolean;
    onToolbarHide: () => void;
    onApplyWidth: (width: number) => void;
    onReset: () => void;
};

const formatNumber = (n: number): string => {
    const rounded = Math.round(n * 100) / 100;
    return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(2);
};

const gcd = (a: number, b: number): number => {
    while (b !== 0) [a, b] = [b, a % b];
    return Math.abs(a);
};

const commonRatios: [number, number][] = [
    [1, 1],
    [5, 4],
    [4, 3],
    [7, 5],
    [3, 2],
    [2, 1],
    [16, 10],
    [16, 9],
    [21, 9],
    [32, 9],
    [1.85, 1],
    [2.35, 1],
    [2.39, 1],
    [2.76, 1],
    [18, 9],
    [19.5, 9],
    [20, 9],
];

export const getAspectRatio = (width: number, height: number): string => {
    if (height === 0) throw new Error("Height cannot be zero");

    const d = gcd(width, height);
    let w = width / d;
    let h = height / d;

    const ratio = w / h;
    const tolerance = 0.01;

    for (const [cw, ch] of commonRatios) {
        const common = cw / ch;
        if (Math.abs(ratio - common) < tolerance) {
            return `${formatNumber(cw)}:${formatNumber(ch)}`;
        }
    }

    if (w > 50) {
        return `${formatNumber(width / height)}:1`;
    }

    return `${formatNumber(w)}:${formatNumber(h)}`;
};

export function OverlayWidget({
    emulation,
    overlayVisible,
    toolbarVisible,
    onToolbarHide,
    onApplyWidth,
    onReset,
}: Props): React.JSX.Element {
    const { w, h } = useViewportSize();
    const bp = getBreakpointName(w);
    const ar = getAspectRatio(w, h);

    if (!overlayVisible) return <></>;

    return (
        <>
            {toolbarVisible ? (
                <ResponsiveToolbar
                    state={emulation}
                    onHide={onToolbarHide}
                    onApplyWidth={onApplyWidth}
                    onReset={onReset}
                />
            ) : null}

            <div className="tw-resizer-widget">
                <div className="tw-resizer-widget-line">
                    <span>
                        {w} × {h} ({ar})
                    </span>
                    <span className="tw-resizer-widget-badge">{bp}</span>
                </div>
                {emulation.active ? (
                    <div className="mt-2 text-[11px] opacity-70">
                        Emulation active{" "}
                        {typeof emulation.scale === "number" ? (
                            <span className="tabular-nums">
                                · scale {emulation.scale.toFixed(3)}
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </>
    );
}
