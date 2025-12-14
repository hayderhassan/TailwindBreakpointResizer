import * as React from "react";
import {
    ASPECT_RATIOS,
    AspectRatio,
    ResizeOptions,
    heightFromRatio,
    matchRatio,
} from "./resizeModel";

export function useResizeControls(initialWidth: number, initialHeight: number) {
    const [width, setWidth] = React.useState(initialWidth);
    const [height, setHeight] = React.useState(initialHeight);
    const [aspectRatio, setAspectRatio] = React.useState<AspectRatio>(ASPECT_RATIOS[0]);

    // If aspect ratio changes, recalc height
    React.useEffect(() => {
        if (aspectRatio.w && aspectRatio.h) {
            setHeight(heightFromRatio(width, aspectRatio));
        }
    }, [aspectRatio, width]);

    // If height changes manually, infer aspect ratio
    React.useEffect(() => {
        const inferred = matchRatio(width, height);
        setAspectRatio(inferred);
    }, [width, height]);

    function updateWidth(next: number) {
        setWidth(next);
        if (aspectRatio.w && aspectRatio.h) {
            setHeight(heightFromRatio(next, aspectRatio));
        }
    }

    function updateHeight(next: number) {
        setHeight(next);
        setAspectRatio(matchRatio(width, next));
    }

    function updateAspectRatio(ratio: AspectRatio) {
        setAspectRatio(ratio);
        if (ratio.w && ratio.h) {
            setHeight(heightFromRatio(width, ratio));
        }
    }

    const options: ResizeOptions = { width, height, aspectRatio };

    return {
        options,
        setWidth: updateWidth,
        setHeight: updateHeight,
        setAspectRatio,
        aspectRatios: ASPECT_RATIOS,
    };
}
