export type ViewportSize = { width: number; height: number };

function safeViewport(v: any): ViewportSize {
    const w = Number(v?.width ?? v?.w);
    const h = Number(v?.height ?? v?.h);

    return {
        width: Number.isFinite(w) && w > 0 ? Math.floor(w) : 1200,
        height: Number.isFinite(h) && h > 0 ? Math.floor(h) : 800,
    };
}

/**
 * Works in popup context by messaging the content script.
 * Requires the content script to implement:
 *   GET_VIEWPORT -> { width, height }
 */
export async function getViewportFromActiveTab(): Promise<ViewportSize> {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { width: 1200, height: 800 };

    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id!, { type: "GET_VIEWPORT" }, (res) => {
            const err = chrome.runtime.lastError;
            if (err) {
                resolve({ width: 1200, height: 800 });
                return;
            }
            resolve(safeViewport(res));
        });
    });
}

export async function getCurrentViewport(): Promise<ViewportSize> {
    return getViewportFromActiveTab();
}
