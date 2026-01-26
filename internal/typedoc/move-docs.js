/* global console,process */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, "api");
const dest = path.resolve(__dirname, "../../apps/docs/api");

const markdownExtension = ".md";
const licenseLinkPattern = /(\]\()([./]*_media\/LICENSE(?:-\d+)?(?:\.html)?)(\))/g;
const repoLicenseUrl = "https://github.com/yeojz/otplib/blob/main/LICENSE";

const listMarkdownFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith(markdownExtension)) {
      files.push(fullPath);
    }
  }
  return files;
};

console.log(`[move-docs] Source: ${src}`);
console.log(`[move-docs] Dest:   ${dest}`);

if (fs.existsSync(dest)) {
  console.log("[move-docs] Removing existing destination...");
  fs.rmSync(dest, { recursive: true, force: true });
}

if (!fs.existsSync(src)) {
  console.error(`[move-docs] Source directory not found: ${src}`);
  process.exit(1);
}

console.log("[move-docs] Moving generated docs...");
try {
  fs.renameSync(src, dest);
} catch (err) {
  if (err.code === "EXDEV") {
    // Fallback if crossing partitions
    fs.cpSync(src, dest, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
  } else {
    throw err;
  }
}

console.log("[move-docs] Rewriting LICENSE links...");
const markdownFiles = listMarkdownFiles(dest);
for (const filePath of markdownFiles) {
  const original = fs.readFileSync(filePath, "utf8");
  const updated = original.replace(licenseLinkPattern, `](${repoLicenseUrl})`);
  if (updated !== original) {
    fs.writeFileSync(filePath, updated, "utf8");
  }
}
console.log("[move-docs] Done.");
