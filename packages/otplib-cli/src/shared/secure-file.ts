import fs from "node:fs";

/**
 * Restrict a file to owner-only read/write (0600).
 *
 * `fs.writeFileSync`'s `mode` option is only applied when the file is
 * newly created — an existing file keeps whatever mode it already had.
 * Calling this after every write closes that gap.
 *
 * No-op on Windows, where POSIX permission bits are not meaningful.
 */
export function chmodSecure(filePath: string): void {
  if (process.platform === "win32") {
    return;
  }
  fs.chmodSync(filePath, 0o600);
}

/**
 * Write `content` to `filePath` and enforce 0600 permissions on the
 * resulting file, even if it already existed with broader permissions.
 *
 * `flag` mirrors `fs.writeFileSync`'s `flag` option: `"w"` (default)
 * overwrites the file, `"a"` appends to it.
 */
export function writeSecretFile(filePath: string, content: string, flag: "w" | "a" = "w"): void {
  fs.writeFileSync(filePath, content, { mode: 0o600, flag });
  chmodSecure(filePath);
}
