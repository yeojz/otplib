#!/usr/bin/env node
/**
 * Bumps versions for packages in a release group and creates a PR.
 *
 * Inputs (via environment):
 *   INPUT_GROUP - Release group name (e.g., "packages", "cli")
 *   INPUT_BUMP  - Version bump type ("major", "minor", "patch")
 *   INPUT_TITLE - PR title format with {group} and {version} placeholders
 *   INPUT_LABEL - Label to add to the PR (optional)
 *   GH_TOKEN    - GitHub token for creating PR
 *
 * Outputs (via GITHUB_OUTPUT):
 *   version - The new version number
 *   group   - The release group name
 *   pr_url  - The URL of the created PR
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const semver = require("semver");

const group = process.env.INPUT_GROUP;
const bumpType = process.env.INPUT_BUMP;
const titleTemplate = process.env.INPUT_TITLE || "release({group}): v{version}";
const label = process.env.INPUT_LABEL || "";
const githubOutput = process.env.GITHUB_OUTPUT;

if (!group || !bumpType) {
  console.error("::error::Missing required inputs: group, bump");
  process.exit(1);
}

/**
 * Execute a command with arguments using spawnSync (avoids shell injection)
 */
function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, { encoding: "utf8", ...options });
  if (result.error) {
    console.error(`::error::Command failed: ${cmd} ${args.join(" ")}`);
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`::error::Command failed: ${cmd} ${args.join(" ")}`);
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }
  return (result.stdout || "").trim();
}

/**
 * Write to GitHub Actions output file
 */
function setOutput(name, value) {
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `${name}=${value}\n`);
  } else {
    console.log(`::set-output name=${name}::${value}`);
  }
}

// Read release groups config
let releaseConfig;
try {
  releaseConfig = JSON.parse(fs.readFileSync("release.config.json", "utf8"));
} catch (err) {
  console.error(`::error::Failed to read release.config.json: ${err.message}`);
  process.exit(1);
}

const packages = releaseConfig.groups[group];

if (!packages || packages.length === 0) {
  console.error(`::error::No packages found for group: ${group}`);
  process.exit(1);
}

console.log(`Processing group "${group}" with ${packages.length} packages`);

/**
 * Find package.json for a given package name
 */
function findPackageJson(pkgName) {
  const searchDirs = ["packages", "apps"];

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const pkgJsonPath = path.join(dir, entry, "package.json");
      if (fs.existsSync(pkgJsonPath)) {
        const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
        if (pkgJson.name === pkgName) {
          return { path: pkgJsonPath, version: pkgJson.version };
        }
      }
    }
  }
  return null;
}

// Collect all packages and find max version
let maxVersion = "0.0.0";
const packagesInfo = [];

for (const pkgName of packages) {
  const info = findPackageJson(pkgName);
  if (!info) {
    console.error(`::error::Could not find package.json for: ${pkgName}`);
    process.exit(1);
  }

  const cleanVersion = semver.clean(info.version);
  if (!cleanVersion) {
    console.error(`::error::Invalid version "${info.version}" for: ${pkgName}`);
    process.exit(1);
  }

  packagesInfo.push({ name: pkgName, path: info.path, version: cleanVersion });

  if (semver.gt(cleanVersion, maxVersion)) {
    maxVersion = cleanVersion;
  }
}

console.log(`Current max version: ${maxVersion}`);

// Calculate new version
const newVersion = semver.inc(maxVersion, bumpType);
if (!newVersion) {
  console.error(`::error::Failed to bump version. Invalid bump type: ${bumpType}`);
  process.exit(1);
}

console.log(`New version: ${newVersion}`);

// Update all packages in the group
for (const pkg of packagesInfo) {
  const pkgJson = JSON.parse(fs.readFileSync(pkg.path, "utf8"));
  pkgJson.version = newVersion;
  fs.writeFileSync(pkg.path, JSON.stringify(pkgJson, null, 2) + "\n");
  console.log(`Updated ${pkg.name} to ${newVersion}`);
}

// Create branch and PR
const branchName = `release/${group}-v${newVersion}`;
const prTitle = titleTemplate.replace("{group}", group).replace("{version}", newVersion);
const commitMessage = prTitle;
const prBody = `${prTitle}

This PR was automatically created by the prepare-release workflow.

**Group:** ${group}
**Bump type:** ${bumpType}
**New version:** ${newVersion}`;

console.log(`\nCreating branch: ${branchName}`);
run("git", ["checkout", "-b", branchName]);

console.log("Committing changes...");
for (const pkg of packagesInfo) {
  run("git", ["add", pkg.path]);
}
run("git", ["commit", "-m", commitMessage]);

console.log("Pushing branch...");
run("git", ["push", "-u", "origin", branchName]);

console.log("Creating PR...");
const prArgs = ["pr", "create", "--title", prTitle, "--body", prBody];
if (label) {
  prArgs.push("--label", label);
}

const prUrl = run("gh", prArgs);
console.log(`PR created: ${prUrl}`);

// Write outputs
setOutput("version", newVersion);
setOutput("group", group);
setOutput("pr_url", prUrl);
