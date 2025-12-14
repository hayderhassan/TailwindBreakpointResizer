import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    build: {
        outDir: "dist",
        emptyOutDir: true,
        rollupOptions: {
            input: {
                devtools: path.resolve(__dirname, "devtools.html"),
                panel: path.resolve(__dirname, "panel.html"),
                content: path.resolve(__dirname, "src/content/content-script.tsx"),
            },
            output: {
                entryFileNames: (chunk) => {
                    if (chunk.name === "content") return "content-script.js";
                    return "[name].js";
                },
            },
        },
    },
});
