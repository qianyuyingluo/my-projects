import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          katex: ["katex"],
        },
      },
    },
  },
  plugins: [react()],
});
