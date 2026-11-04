import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Database (RLS) tests — need a running local Supabase. See README → Testing.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/db/**/*.db.test.ts"],
    environment: "node",
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
