import { existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * The source uses NodeNext-style `.js` import specifiers that physically resolve
 * to `.ts` files. Vite/esbuild don't do that mapping by default, so this small
 * pre-resolver rewrites relative `*.js` imports to their `*.ts` sibling for tests.
 */
function resolveJsToTs(): Plugin {
  return {
    name: "resolve-js-to-ts",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer) return null;
      if (!source.endsWith(".js")) return null;
      if (!source.startsWith("./") && !source.startsWith("../")) return null;
      const tsPath = path.resolve(path.dirname(importer), source.replace(/\.js$/, ".ts"));
      return existsSync(tsPath) ? tsPath : null;
    },
  };
}

export default defineConfig({
  plugins: [resolveJsToTs()],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    globals: false,
  },
});
