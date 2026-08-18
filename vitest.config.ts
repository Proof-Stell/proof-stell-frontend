import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// @vitejs/plugin-react transforms JSX/TSX via Babel regardless of which
// lower-level transform (esbuild or oxc) Vite is using by default, so it
// works independent of tsconfig's "jsx": "preserve" (that setting is for
// Next's own build compiler, not for Vitest).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
