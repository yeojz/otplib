import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.resolve(__dirname, "api");
const dest = path.resolve(__dirname, "../../apps/docs/api");

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
console.log("[move-docs] Done.");
