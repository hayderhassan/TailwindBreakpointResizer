export const TW_BREAKPOINTS = [
    { name: "sm", min: 640 },
    { name: "md", min: 768 },
    { name: "lg", min: 1024 },
    { name: "xl", min: 1280 },
    { name: "2xl", min: 1536 },
] as const;

export type BreakpointName = "base" | (typeof TW_BREAKPOINTS)[number]["name"];

export function getBreakpointName(width: number): BreakpointName {
    let current: BreakpointName = "base";
    for (const bp of TW_BREAKPOINTS) {
        if (width >= bp.min) current = bp.name;
    }
    return current;
}

export type EmulationState = {
    active: boolean;
    width?: number;
    height?: number;
    scale?: number;
    positionX?: number;
    reason?: string;
};
