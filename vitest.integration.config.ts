import { defineConfig } from "vitest/config";
import path from "path";

// Separate from vitest.config.ts: these tests make real HTTP calls to a
// local Supabase instance (`supabase start`) rather than mocking it, so they
// need Node's fetch, not jsdom, and should never run mixed in with the fast
// unit suite. Run via `npm run test:integration` — requires Docker + the
// Supabase CLI (already a devDependency: `npx supabase start && npx supabase
// db reset` before running).
export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 30000,
    // These share global auth/DB state against one local Supabase instance —
    // running files in parallel hammered GoTrue's admin API hard enough to
    // produce spurious "Database error creating new user" failures.
    fileParallelism: false,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
