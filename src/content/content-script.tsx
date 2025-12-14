import * as React from "react";
import { createRoot, Root } from "react-dom/client";
import { OverlayWidget } from "./OverlayWidget";
import tailwindCss from "../styles/tailwind.css?inline";

const HOST_ID = "tw-resize-overlay-host";

let root: Root | null = null;
let visible = true;

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
        root.render(
            <React.StrictMode>
                <OverlayWidget />
            </React.StrictMode>,
        );
    }

    return host;
}

function setVisible(next: boolean): void {
    const host = ensureMounted();
    visible = next;
    host.style.display = visible ? "" : "none";
}

ensureMounted();

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "OVERLAY_SET_VISIBLE") {
        setVisible(Boolean(msg.visible));
        sendResponse({ ok: true, visible });
        return true;
    }

    if (msg?.type === "OVERLAY_TOGGLE") {
        setVisible(!visible);
        sendResponse({ ok: true, visible });
        return true;
    }

    if (msg?.type === "OVERLAY_GET_STATE") {
        sendResponse({ ok: true, visible });
        return true;
    }

    return false;
});
