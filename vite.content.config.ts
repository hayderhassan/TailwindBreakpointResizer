import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],
    resolve: {
        dedupe: ["react", "react-dom", "react-dom/client"],
    },
    define: {
        "process.env.NODE_ENV": '"production"',
    },
    build: {
        outDir: "dist",
        emptyOutDir: false,
        minify: true,
        lib: {
            entry: "src/content/content-script.tsx",
            name: "TwOverlay",
            formats: ["iife"],
            fileName: () => "content-script.js",
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true,
                banner: `var process = { env: { NODE_ENV: "production" } };`,
            },
        },
    },
});
