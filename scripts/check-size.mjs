#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const DEFAULT_EXTENSIONS = [".js"];

function parseKilobytes(input) {
  const match = /^\s*(\d+(?:\.\d+)?)\s*KB\s*$/i.exec(input);

  if (!match) {
    throw new Error(`Invalid bundle size limit "${input}". Expected a value like "2.5 KB".`);
  }

  return Math.round(Number.parseFloat(match[1]) * 1000);
}

function formatKilobytes(bytes) {
  return `${(bytes / 1000).toFixed(1)} KB`;
}

function normalizeExtensions(value) {
  if (Array.isArray(value) && value.length > 0) {
    return value;
  }

  if (typeof value === "string" && value.length > 0) {
    return [value];
  }

  return [...DEFAULT_EXTENSIONS];
}

function matchesExtension(filePath, extensions) {
  return extensions.some((extension) => filePath.endsWith(extension));
}

function dedupe(list) {
  return [...new Set(list)];
}

function collectBinPaths(binField) {
  if (typeof binField === "string") {
    return [binField];
  }

  if (!binField || typeof binField !== "object") {
    return [];
  }

  return Object.values(binField).filter((value) => typeof value === "string");
}

function collectExportPaths(exportsField, runtime) {
  const collected = [];

  function visit(node, currentRuntime) {
    if (typeof node === "string") {
      collected.push({ file: node, runtime: currentRuntime });
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item, currentRuntime);
      }

      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "types") {
        continue;
      }

      let nextRuntime = currentRuntime;

      if (key === "import") {
        nextRuntime = "esm";
      } else if (key === "require") {
        nextRuntime = "cjs";
      }

      visit(value, nextRuntime);
    }
  }

  visit(exportsField, runtime);

  return collected;
}

function inferRuntimeFromExtensions(extensions) {
  if (extensions.some((extension) => extension.endsWith(".cjs") || extension.endsWith(".cts"))) {
    return "cjs";
  }

  return "esm";
}

function normalizeArtifactPath(packageDir, file) {
  const resolved = path.resolve(packageDir, file);
  const relative = path.relative(packageDir, resolved);

  if (
    path.isAbsolute(relative) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`)
  ) {
    throw new Error(`Artifact path "${file}" resolves outside the package directory.`);
  }

  return resolved;
}

function selectArtifacts(manifest, packageDir, extensions) {
  const runtime = inferRuntimeFromExtensions(extensions);
  const selected = [];

  if (runtime === "esm" && typeof manifest.module === "string") {
    selected.push({ file: manifest.module, source: "module" });
  }

  if (runtime === "cjs" && typeof manifest.main === "string") {
    selected.push({ file: manifest.main, source: "main" });
  }

  if (runtime === "cjs") {
    for (const file of collectBinPaths(manifest.bin)) {
      selected.push({ file, source: "bin" });
    }
  }

  for (const candidate of collectExportPaths(manifest.exports, runtime)) {
    if (candidate.runtime && candidate.runtime !== runtime) {
      continue;
    }

    selected.push({ file: candidate.file, source: "exports" });
  }

  const filtered = selected.filter((candidate) => matchesExtension(candidate.file, extensions));

  return dedupe(filtered.map((candidate) => normalizeArtifactPath(packageDir, candidate.file)));
}

async function readJson(jsonPath) {
  return JSON.parse(await readFile(jsonPath, "utf8"));
}

async function listPackages(repoRoot) {
  const packagesDir = path.join(repoRoot, "packages");
  const entries = await readdir(packagesDir, { withFileTypes: true });
  const packages = new Map();

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const dir = path.join(packagesDir, entry.name);
    const manifestPath = path.join(dir, "package.json");
    const manifest = await readJson(manifestPath);

    packages.set(manifest.name, {
      dir,
      manifest,
      dependencies: Object.keys(manifest.dependencies ?? {}),
    });
  }

  return packages;
}

async function measureArtifacts(filePaths) {
  const artifacts = [];

  for (const filePath of filePaths) {
    const content = await readFile(filePath);
    artifacts.push({
      path: filePath,
      sizeBytes: gzipSync(content).length,
    });
  }

  return artifacts;
}

function uniqueExtensionGroups(groups) {
  const seen = new Set();
  const unique = [];

  for (const group of groups) {
    const key = group.join("|");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(group);
  }

  return unique;
}

function createResolvers({ packages, bundleConfig }) {
  const selectionCache = new Map();
  const measurementCache = new Map();

  function packageExtensions(packageName) {
    return normalizeExtensions(bundleConfig[packageName]?.ext);
  }

  function selectionKey(packageName, extensions) {
    return `${packageName}::${extensions.join(",")}`;
  }

  function getPackage(packageName) {
    const pkg = packages.get(packageName);

    if (!pkg) {
      throw new Error(`Configured bundle size package "${packageName}" was not found under packages/.`);
    }

    return pkg;
  }

  function getArtifacts(packageName, extensions) {
    const key = selectionKey(packageName, extensions);

    if (selectionCache.has(key)) {
      return selectionCache.get(key);
    }

    const pkg = getPackage(packageName);
    const filePaths = selectArtifacts(pkg.manifest, pkg.dir, extensions);
    selectionCache.set(key, filePaths);
    return filePaths;
  }

  async function measureForExtensions(packageName, extensions) {
    const key = selectionKey(packageName, extensions);

    if (measurementCache.has(key)) {
      return measurementCache.get(key);
    }

    const pkg = getPackage(packageName);
    const filePaths = getArtifacts(packageName, extensions);

    if (filePaths.length === 0) {
      const empty = null;
      measurementCache.set(key, empty);
      return empty;
    }

    const measuredArtifacts = await measureArtifacts(filePaths);
    const sizeBytes = Math.max(...measuredArtifacts.map((artifact) => artifact.sizeBytes));
    const measured = {
      packageName,
      extensions,
      sizeBytes,
      artifacts: measuredArtifacts,
      dependencies: pkg.dependencies.filter((dependency) => packages.has(dependency)),
    };

    measurementCache.set(key, measured);
    return measured;
  }

  async function resolveMeasurement(packageName, preferredExtensions, { allowFallback }) {
    const candidates = allowFallback
      ? uniqueExtensionGroups([preferredExtensions, packageExtensions(packageName), DEFAULT_EXTENSIONS, [".cjs"]])
      : [preferredExtensions];

    for (const extensions of candidates) {
      const measured = await measureForExtensions(packageName, extensions);

      if (measured) {
        return measured;
      }
    }

    const tried = candidates.map((extensions) => extensions.join(", ")).join(" | ");
    throw new Error(`No declared public artifacts found for "${packageName}" using ${tried}.`);
  }

  return {
    packageExtensions,
    resolveMeasurement,
  };
}

function resolveTransitiveDependencies(packages, rootName) {
  const visited = new Set();
  const queue = [...(packages.get(rootName)?.dependencies ?? []).filter((dependency) => packages.has(dependency))];

  while (queue.length > 0) {
    const current = queue.shift();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const dependency of packages.get(current)?.dependencies ?? []) {
      if (!visited.has(dependency) && packages.has(dependency)) {
        queue.push(dependency);
      }
    }
  }

  return [...visited];
}

export async function analyzeBundleSizes({ repoRoot }) {
  const configPath = path.join(repoRoot, "release.config.json");
  const config = await readJson(configPath);
  const bundleConfig = config.bundleSize ?? {};
  const packages = await listPackages(repoRoot);
  const resolvers = createResolvers({ packages, bundleConfig });
  const results = [];

  for (const packageName of Object.keys(bundleConfig)) {
    const packageConfig = bundleConfig[packageName];
    const extensions = resolvers.packageExtensions(packageName);
    const ownMeasurement = await resolvers.resolveMeasurement(packageName, extensions, { allowFallback: false });
    const limitBytes = parseKilobytes(packageConfig.limit);
    let nsSizeBytes = null;
    let nsLimitBytes = null;
    let status = ownMeasurement.sizeBytes > limitBytes ? "FAIL" : "PASS";

    if (typeof packageConfig.nsLimit === "string" && packageConfig.nsLimit.length > 0) {
      nsLimitBytes = parseKilobytes(packageConfig.nsLimit);
      nsSizeBytes = ownMeasurement.sizeBytes;

      for (const dependency of resolveTransitiveDependencies(packages, packageName)) {
        const dependencyMeasurement = await resolvers.resolveMeasurement(dependency, extensions, {
          allowFallback: true,
        });

        nsSizeBytes += dependencyMeasurement.sizeBytes;
      }

      if (nsSizeBytes > nsLimitBytes) {
        status = "FAIL";
      }
    }

    results.push({
      package: packageName,
      sizeBytes: ownMeasurement.sizeBytes,
      limitBytes,
      nsSizeBytes,
      nsLimitBytes,
      status,
    });
  }

  return results;
}

function formatJson(results) {
  return JSON.stringify(
    results.map((result) => ({
      package: result.package,
      size: formatKilobytes(result.sizeBytes),
      limit: formatKilobytes(result.limitBytes),
      nsSize: result.nsSizeBytes === null ? null : formatKilobytes(result.nsSizeBytes),
      nsLimit: result.nsLimitBytes === null ? null : formatKilobytes(result.nsLimitBytes),
      status: result.status,
    })),
    null,
    2,
  );
}

function formatTable(results) {
  const lines = [
    `| ${"Package".padEnd(35)} | ${"Size".padStart(8)} | ${"Limit".padStart(8)} | ${"NS Size".padStart(8)} | ${"NS Limit".padStart(8)} | ${"Status".padStart(6)} |`,
    `| ${"-".repeat(35)} | ${"-".repeat(8)} | ${"-".repeat(8)} | ${"-".repeat(8)} | ${"-".repeat(8)} | ${"-".repeat(6)} |`,
  ];

  for (const result of results) {
    lines.push(
      `| ${result.package.padEnd(35)} | ${formatKilobytes(result.sizeBytes).padStart(8)} | ${formatKilobytes(result.limitBytes).padStart(8)} | ${(result.nsSizeBytes === null ? "-" : formatKilobytes(result.nsSizeBytes)).padStart(8)} | ${(result.nsLimitBytes === null ? "-" : formatKilobytes(result.nsLimitBytes)).padStart(8)} | ${result.status.padStart(6)} |`,
    );
  }

  return lines.join("\n");
}

export async function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  const jsonMode = argv.includes("--json");
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

  try {
    const results = await analyzeBundleSizes({ repoRoot });
    const hasFailure = results.some((result) => result.status === "FAIL");

    if (jsonMode) {
      stdout.write(`${formatJson(results)}\n`);
    } else {
      stdout.write(`${formatTable(results)}\n\n`);
      stdout.write(hasFailure ? "ERROR: One or more bundle size checks failed.\n" : "All bundle size checks passed.\n");
    }

    return hasFailure ? 1 : 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`Error: ${message}\n`);
    return 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const exitCode = await main();
  process.exit(exitCode);
}
