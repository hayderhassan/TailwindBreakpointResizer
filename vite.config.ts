import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ["react", "react-dom", "react-dom/client"],
    },
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                devtools: path.resolve(__dirname, "devtools.html"),
                panel: path.resolve(__dirname, "panel.html"),
                popup: path.resolve(__dirname, "popup.html"),
                background: path.resolve(__dirname, "src/background.ts"),
            },
            output: {
                entryFileNames: (chunk) =>
                    chunk.name === "background" ? "background.js" : "[name].js",
            },
        },
    },
});
