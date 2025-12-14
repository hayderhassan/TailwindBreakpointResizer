export type AspectRatio = {
    label: string;
    w: number;
    h: number;
};

export const ASPECT_RATIOS: AspectRatio[] = [
    { label: "None", w: 0, h: 0 },
    { label: "16:9", w: 16, h: 9 },
    { label: "4:3", w: 4, h: 3 },
    { label: "3:2", w: 3, h: 2 },
    { label: "21:9", w: 21, h: 9 },
    { label: "1:1", w: 1, h: 1 },
    { label: "9:16", w: 9, h: 16 },
];

export type ResizeOptions = {
    width: number;
    height: number;
    aspectRatio: AspectRatio;
};

export function heightFromRatio(width: number, ratio: AspectRatio): number {
    if (!ratio.w || !ratio.h) return 0;
    return Math.round((width * ratio.h) / ratio.w);
}

export function matchRatio(width: number, height: number): AspectRatio {
    for (const r of ASPECT_RATIOS) {
        if (!r.w || !r.h) continue;
        if (Math.round((width * r.h) / r.w) === height) {
            return r;
        }
    }
    return ASPECT_RATIOS[0]; // None
}
