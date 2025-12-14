import * as React from "react";
import { createRoot } from "react-dom/client";
import { OverlayWidget } from "./OverlayWidget";

// Import compiled Tailwind CSS as a string for Shadow DOM injection
// Vite supports ?inline to load as text.
import tailwindCss from "../styles/tailwind.css?inline";

function mount() {
    // Avoid double-mount if the page re-injects scripts
    if (document.getElementById("tw-resize-overlay-host")) return;

    const host = document.createElement("div");
    host.id = "tw-resize-overlay-host";
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = tailwindCss;
    shadow.appendChild(style);

    const app = document.createElement("div");
    shadow.appendChild(app);

    createRoot(app).render(
        <React.StrictMode>
            <OverlayWidget />
        </React.StrictMode>,
    );
}

mount();
