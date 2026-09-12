import fs from "node:fs";

const OPEN_FLAGS: Record<"w" | "a", number> = {
  w: fs.constants.O_WRONLY | fs.constants.O_CREAT,
  a: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND,
};

/**
 * Write `content` to `filePath` with 0600 permissions applied through the
 * file descriptor before any content is written, so a broader-permission
 * window is never observable.
 *
 * The sequence for flag `"w"` is: open the file without `O_TRUNC` (creating
 * it with mode 0600 when new), fchmod the descriptor to 0600 on POSIX
 * platforms, truncate it, then write and close. Truncation deliberately
 * comes after the fchmod so a failed hardening step leaves the previous
 * contents intact — for a key or vault file, truncating first would destroy
 * the stored secret on an fchmod error such as `EPERM` — while the file's
 * permissions are still corrected before any new bytes land.
 *
 * `flag` mirrors `fs.writeFileSync`'s `flag` option: `"w"` (default)
 * overwrites the file, `"a"` appends to it and never truncates. The write
 * itself goes through `fs.writeFileSync(fd, ...)` rather than a single
 * `fs.writeSync` call, so a short underlying write (which `writeSync` does
 * not retry) can't silently truncate the secret.
 *
 * On POSIX platforms the open also passes `O_NOFOLLOW`, so a symlink planted
 * at `filePath` by another party causes the open to fail (`ELOOP`) instead
 * of writing the secret through to whatever the link points at. No-op for
 * both the chmod and the symlink check on Windows, where POSIX permission
 * bits and `O_NOFOLLOW` are not meaningful.
 */
export function writeSecretFile(filePath: string, content: string, flag: "w" | "a" = "w"): void {
  const isWindows = process.platform === "win32";
  const openFlags = isWindows ? OPEN_FLAGS[flag] : OPEN_FLAGS[flag] | fs.constants.O_NOFOLLOW;

  let fd: number;
  try {
    fd = fs.openSync(filePath, openFlags, 0o600);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ELOOP") {
      throw new Error(`Refusing to write through a symlink: ${filePath}`);
    }
    throw err;
  }

  try {
    if (!isWindows) {
      fs.fchmodSync(fd, 0o600);
    }
    if (flag === "w") {
      fs.ftruncateSync(fd, 0);
    }
    fs.writeFileSync(fd, content);
  } finally {
    fs.closeSync(fd);
  }
}
