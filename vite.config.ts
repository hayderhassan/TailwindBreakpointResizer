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
                popup: path.resolve(__dirname, "popup.html"),
                background: path.resolve(__dirname, "src/background.ts"),
            },
            output: {
                entryFileNames: (chunk) => {
                    if (chunk.name === "background") return "background.js";
                    return "[name].js";
                },
            },
        },
    },
});
