import fs from "node:fs";

/**
 * Write `content` to `filePath` with 0600 permissions applied through the
 * file descriptor before any content is written, so a broader-permission
 * window is never observable.
 *
 * The sequence is: open the file (creating it with mode 0600 when new),
 * fchmod the descriptor to 0600 on POSIX platforms, then write and close.
 * If the fchmod call throws, the descriptor is closed and the error is
 * rethrown before anything is written — a failed hardening step must not
 * leave the secret exposed.
 *
 * Note: opening an existing file with flag `"w"` truncates it before the
 * fchmod runs. That is acceptable — truncation only destroys the previous
 * (already-written) content, it does not expose the new secret, and the
 * file's permissions are corrected before any new bytes land.
 *
 * `flag` mirrors `fs.writeFileSync`'s `flag` option: `"w"` (default)
 * overwrites the file, `"a"` appends to it.
 *
 * No-op for the chmod step on Windows, where POSIX permission bits are
 * not meaningful.
 */
export function writeSecretFile(filePath: string, content: string, flag: "w" | "a" = "w"): void {
  const fd = fs.openSync(filePath, flag, 0o600);
  try {
    if (process.platform !== "win32") {
      fs.fchmodSync(fd, 0o600);
    }
    fs.writeSync(fd, content);
  } finally {
    fs.closeSync(fd);
  }
}
