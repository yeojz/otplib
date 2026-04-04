import { gzipSync } from "node:zlib";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { describe, expect, it } from "vitest";

function gzipSize(content: string): number {
  return gzipSync(Buffer.from(content)).length;
}

function makeChunk(prefix: string, count: number): string {
  return Array.from(
    { length: count },
    (_, index) => `${prefix}-${index.toString(16).padStart(4, "0")}`,
  ).join("|");
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

describe("check-size analyzer", () => {
  it("measures declared artifacts individually and keeps namespace totals on the selected runtime", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "check-size-fixture-"));

    try {
      const libIndexEsm = `export const index = "${makeChunk("lib-esm-index", 320)}";\n`;
      const libExtraEsm = `export const extra = "${makeChunk("lib-esm-extra", 480)}";\n`;
      const libIndexCjs = `module.exports = "${makeChunk("lib-cjs-index", 560)}";\n`;
      const libExtraCjs = `module.exports = "${makeChunk("lib-cjs-extra", 720)}";\n`;
      const cliMainCjs = `module.exports = "${makeChunk("cli-main", 260)}";\n`;
      const cliBinCjs = `module.exports = "${makeChunk("cli-bin", 410)}";\n`;

      await mkdir(path.join(repoRoot, "packages/lib/dist"), { recursive: true });
      await mkdir(path.join(repoRoot, "packages/cli/dist"), { recursive: true });

      await writeJson(path.join(repoRoot, "release.config.json"), {
        groups: { packages: ["lib", "cli"] },
        bundleSize: {
          lib: { limit: "10 KB" },
          cli: { ext: [".cjs"], limit: "10 KB", nsLimit: "20 KB" },
        },
      });

      await writeJson(path.join(repoRoot, "packages/lib/package.json"), {
        name: "lib",
        main: "./dist/index.cjs",
        module: "./dist/index.js",
        exports: {
          ".": {
            import: { default: "./dist/index.js" },
            require: { default: "./dist/index.cjs" },
          },
          "./extra": {
            import: { default: "./dist/extra.js" },
            require: { default: "./dist/extra.cjs" },
          },
        },
      });

      await writeJson(path.join(repoRoot, "packages/cli/package.json"), {
        name: "cli",
        main: "./dist/index.cjs",
        bin: {
          cli: "./dist/cli.cjs",
        },
        dependencies: {
          lib: "workspace:*",
        },
      });

      await writeFile(path.join(repoRoot, "packages/lib/dist/index.js"), libIndexEsm);
      await writeFile(path.join(repoRoot, "packages/lib/dist/extra.js"), libExtraEsm);
      await writeFile(path.join(repoRoot, "packages/lib/dist/index.cjs"), libIndexCjs);
      await writeFile(path.join(repoRoot, "packages/lib/dist/extra.cjs"), libExtraCjs);
      await writeFile(path.join(repoRoot, "packages/cli/dist/index.cjs"), cliMainCjs);
      await writeFile(path.join(repoRoot, "packages/cli/dist/cli.cjs"), cliBinCjs);

      const { analyzeBundleSizes } = await import("../../../scripts/check-size.mjs");
      const results = await analyzeBundleSizes({ repoRoot });

      const libResult = results.find((item) => item.package === "lib");
      const cliResult = results.find((item) => item.package === "cli");

      expect(libResult).toBeDefined();
      expect(cliResult).toBeDefined();

      if (!libResult || !cliResult) {
        return;
      }

      const libEsmMax = Math.max(gzipSize(libIndexEsm), gzipSize(libExtraEsm));
      const libEsmConcat = gzipSize(`${libIndexEsm}${libExtraEsm}`);
      const libCjsMax = Math.max(gzipSize(libIndexCjs), gzipSize(libExtraCjs));
      const cliCjsMax = Math.max(gzipSize(cliMainCjs), gzipSize(cliBinCjs));

      expect(libResult.sizeBytes).toBe(libEsmMax);
      expect(libResult.sizeBytes).not.toBe(libEsmConcat);

      expect(cliResult.sizeBytes).toBe(cliCjsMax);
      expect(cliResult.nsSizeBytes).toBe(cliCjsMax + libCjsMax);
      expect(cliResult.nsSizeBytes).not.toBe(cliCjsMax + libEsmMax);
    } finally {
      await rm(repoRoot, { recursive: true, force: true });
    }
  });
});
