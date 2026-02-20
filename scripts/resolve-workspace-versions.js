#!/usr/bin/env node

/**
 * Replaces "*" dependency versions with actual versions from workspace packages.
 *
 * pnpm's `workspace:*` protocol automatically replaces versions at publish time.
 * npm does not do this, so this script replicates that behavior.
 *
 * Usage:
 *   node scripts/resolve-workspace-versions.js          # replace * with ^version
 *   node scripts/resolve-workspace-versions.js --check  # verify no * deps remain (dry-run)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { globSync } from "node:fs";

const rootDir = resolve(import.meta.dirname, "..");
const rootPkg = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf8"));
const isCheck = process.argv.includes("--check");

// Collect all workspace package names and versions
const workspaceMap = new Map();
for (const pattern of rootPkg.workspaces) {
  const dirs = globSync(join(rootDir, pattern), { withFileTypes: false });
  for (const dir of dirs) {
    const pkgPath = join(dir, "package.json");
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      if (pkg.name) {
        workspaceMap.set(pkg.name, { version: pkg.version, path: pkgPath });
      }
    } catch {
      // skip directories without package.json
    }
  }
}

let hasUnresolved = false;
let filesChanged = 0;

for (const [, { path: pkgPath }] of workspaceMap) {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  let changed = false;

  for (const depField of ["dependencies", "peerDependencies"]) {
    const deps = pkg[depField];
    if (!deps) continue;

    for (const [depName, depVersion] of Object.entries(deps)) {
      if (depVersion === "*" && workspaceMap.has(depName)) {
        const resolvedVersion = `^${workspaceMap.get(depName).version}`;
        if (isCheck) {
          console.error(
            `${pkg.name}: ${depField}.${depName} is "*" (should be "${resolvedVersion}")`,
          );
          hasUnresolved = true;
        } else {
          deps[depName] = resolvedVersion;
          changed = true;
        }
      }
    }
  }

  if (changed) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    filesChanged++;
    console.log(`Updated ${pkg.name}`);
  }
}

if (isCheck && hasUnresolved) {
  console.error(
    "\nUnresolved workspace dependencies found. Run: node scripts/resolve-workspace-versions.js",
  );
  process.exit(1);
}

if (!isCheck) {
  console.log(`\nDone. ${filesChanged} package(s) updated.`);
}
