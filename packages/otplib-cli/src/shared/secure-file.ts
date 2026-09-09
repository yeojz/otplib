import fs from "node:fs";

const OPEN_FLAGS: Record<"w" | "a", number> = {
  w: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_TRUNC,
  a: fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_APPEND,
};

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
 * overwrites the file, `"a"` appends to it. The write itself goes through
 * `fs.writeFileSync(fd, ...)` rather than a single `fs.writeSync` call, so a
 * short underlying write (which `writeSync` does not retry) can't silently
 * truncate the secret.
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
    fs.writeFileSync(fd, content);
  } finally {
    fs.closeSync(fd);
  }
}
