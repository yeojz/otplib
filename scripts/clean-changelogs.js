#!/usr/bin/env node
/* global console, process */

/**
 * Script to remove all CHANGELOG.md files from packages after changeset version runs.
 * This keeps only the root CHANGELOG.md file if it exists.
 *
 * Usage: node scripts/clean-changelogs.js
 */

import { readdir, rm, stat } from "node:fs/promises";
import { join } from "node:path";

const CLEANUP_PATHS = [
  join(import.meta.dirname, "..", "packages"),
  join(import.meta.dirname, "..", "internal"),
  join(import.meta.dirname, "..", "apps"),
];

async function findAndRemoveChangelogs(baseDir) {
  const removed = [];

  try {
    const entries = await readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const changelogPath = join(baseDir, entry.name, "CHANGELOG.md");

        try {
          await stat(changelogPath);
          await rm(changelogPath);
          removed.push(changelogPath);
          console.log(`Removed: ${changelogPath}`);
        } catch {
          // CHANGELOG.md doesn't exist in this package, skip
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${baseDir}: ${error.message}`);
  }

  return removed;
}

async function main() {
  console.log("Cleaning up package CHANGELOG.md files...\n");

  let totalRemoved = 0;
  for (const path of CLEANUP_PATHS) {
    const removed = await findAndRemoveChangelogs(path);
    totalRemoved += removed.length;
  }

  if (totalRemoved === 0) {
    console.log("\nNo CHANGELOG.md files found in packages.");
  } else {
    console.log(`\nRemoved ${totalRemoved} CHANGELOG.md file(s).`);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
