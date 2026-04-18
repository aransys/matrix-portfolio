import { defineConfig } from "vitest/config";

// Vitest config is deliberately kept in a separate file from vite.config.ts.
// Vitest bundles its own vite internally, which has a slightly different
// Plugin<> shape than the project's top-level vite 8 — sharing a single
// config file produces spurious type errors from the mismatched types.
//
// The hooks + their tests are pure .ts (no JSX), so we don't need the React
// plugin here. Vitest/esbuild handles TS natively.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    // Keep test state clean between files — no accidental cross-test leakage
    // from the stubbed IntersectionObserver.
    restoreMocks: true,
    clearMocks: true,
  },
});
