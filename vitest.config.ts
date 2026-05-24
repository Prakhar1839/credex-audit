import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    alias: {
      "@/": new URL("./", import.meta.url).pathname,
    },
  },
});
