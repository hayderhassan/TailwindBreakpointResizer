import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import tailwindCss from "../styles/tailwind.css?inline";
import { OverlayWidget } from "./OverlayWidget";
import type { EmulationState } from "../shared/breakpoints";

const HOST_ID = "tw-resize-overlay-host";

let root: Root | null = null;

// UI visibility
let overlayVisible = true;
let toolbarVisible = true;

// Emulation state (driven by background)
let emulationState: EmulationState = { active: false };

function ensureMounted(): HTMLDivElement {
    let host = document.getElementById(HOST_ID) as HTMLDivElement | null;

    if (!host) {
        host = document.createElement("div");
        host.id = HOST_ID;
        document.documentElement.appendChild(host);

        const shadow = host.attachShadow({ mode: "open" });

        const style = document.createElement("style");
        style.textContent = tailwindCss;
        shadow.appendChild(style);

        const app = document.createElement("div");
        shadow.appendChild(app);

        root = createRoot(app);
    }

    return host;
}

function render() {
    const host = ensureMounted();
    host.style.display = overlayVisible ? "" : "none";

    root?.render(
        <React.StrictMode>
            <OverlayWidget
                emulation={emulationState}
                overlayVisible={overlayVisible}
                toolbarVisible={toolbarVisible && emulationState.active}
                onToolbarHide={() => {
                    toolbarVisible = false;
                    render();
                }}
                onApplyWidth={(width) => {
                    chrome.runtime.sendMessage({ type: "RESIZE_APPLY", payload: { width } });
                }}
                onReset={() => {
                    chrome.runtime.sendMessage({ type: "RESIZE_RESET" });
                }}
            />
        </React.StrictMode>,
    );
}

function setOverlayVisible(next: boolean): void {
    overlayVisible = next;
    render();
}

function setToolbarVisible(next: boolean): void {
    toolbarVisible = next;
    render();
}

function setEmulationState(next: EmulationState): void {
    emulationState = next;
    // When emulation becomes active, ensure toolbar is visible again (nice UX)
    if (next.active) toolbarVisible = true;
    render();
}

ensureMounted();
render();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "OVERLAY_SET_VISIBLE") {
        setOverlayVisible(Boolean(msg.visible));
        sendResponse({ ok: true, visible: overlayVisible });
        return true;
    }

    if (msg?.type === "OVERLAY_TOGGLE") {
        setOverlayVisible(!overlayVisible);
        sendResponse({ ok: true, visible: overlayVisible });
        return true;
    }

    if (msg?.type === "OVERLAY_GET_STATE") {
        sendResponse({ ok: true, visible: overlayVisible });
        return true;
    }

    if (msg?.type === "TOOLBAR_SET_VISIBLE") {
        setToolbarVisible(Boolean(msg.visible));
        sendResponse({ ok: true, visible: toolbarVisible });
        return true;
    }

    if (msg?.type === "EMULATION_STATE") {
        setEmulationState(msg.state as EmulationState);
        sendResponse({ ok: true });
        return true;
    }

    return false;
});
