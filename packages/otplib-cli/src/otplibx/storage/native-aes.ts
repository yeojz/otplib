import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { parseEnvFile, serializeEnvFile } from "./env-parser.js";
import { ErrorCodes, OtplibxStorageError } from "./errors.js";
import { writeSecretFile } from "../../shared/secure-file.js";

import type { OtplibxStorage, StorageStatus } from "./types.js";

const ENCRYPTED_PREFIX = "encrypted:";
const IV_LENGTH = 12; // GCM recommended IV length
const AUTH_TAG_LENGTH = 16; // GCM auth tag length
const KEY_LENGTH = 32; // 256 bits

const ENV_VAR_NAME = "OTPLIBX_ENCRYPTION_KEY";
const KEYS_FILE_NAME = ".env.keys";

/**
 * Encrypt a plaintext value using AES-256-GCM
 * Returns: encrypted:BASE64(IV || AUTH_TAG || CIPHERTEXT)
 */
function encrypt(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine: IV || AUTH_TAG || CIPHERTEXT
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return `${ENCRYPTED_PREFIX}${combined.toString("base64")}`;
}

/**
 * Decrypt an encrypted value
 * Input format: encrypted:BASE64(IV || AUTH_TAG || CIPHERTEXT)
 */
function decrypt(encryptedValue: string, key: Buffer): string {
  if (!encryptedValue.startsWith(ENCRYPTED_PREFIX)) {
    // Not encrypted, return as-is
    return encryptedValue;
  }

  const base64Data = encryptedValue.slice(ENCRYPTED_PREFIX.length);

  let combined: Buffer;
  try {
    combined = Buffer.from(base64Data, "base64");
  } catch {
    throw new OtplibxStorageError("Invalid encrypted value format", ErrorCodes.DECRYPT_FAILED);
  }

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new OtplibxStorageError("Encrypted value too short", ErrorCodes.DECRYPT_FAILED);
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString("utf8");
  } catch {
    throw new OtplibxStorageError(
      "Decryption failed - invalid key or corrupted data",
      ErrorCodes.DECRYPT_FAILED,
    );
  }
}

/**
 * Generate a new 256-bit encryption key
 */
function generateKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Parse a hex-encoded key string into a Buffer
 */
function parseKey(keyHex: string): Buffer {
  if (!/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    throw new OtplibxStorageError(
      "Invalid key format - expected 64 hex characters",
      ErrorCodes.INVALID_KEY,
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Get the path to the .env.keys file for a given secrets file
 */
function getKeysFilePath(envFilePath: string): string {
  return path.join(path.dirname(envFilePath), KEYS_FILE_NAME);
}

/**
 * Throw if `filePath` is readable/writable by the group or other bits
 * (i.e. anything beyond owner rwx). No-op on Windows, where POSIX mode
 * bits are not meaningful.
 */
function assertSecurePermissions(filePath: string): void {
  if (process.platform === "win32") {
    return;
  }
  const { mode } = fs.statSync(filePath);
  if ((mode & 0o077) !== 0) {
    throw new OtplibxStorageError(
      `Encryption key file is readable by group/other: ${filePath}. Run 'chmod 600 ${filePath}' and try again.`,
      ErrorCodes.INSECURE_PERMISSIONS,
    );
  }
}

/**
 * Warn (without blocking) if `filePath` is readable/writable by the
 * group or other bits. Used for the vault file, which is ciphertext —
 * unlike the key file, an over-permissive vault is not fatal, but it's
 * still worth flagging so the user can tighten it. No-op on Windows.
 */
function warnIfInsecurePermissions(filePath: string): void {
  if (process.platform === "win32") {
    return;
  }
  const { mode } = fs.statSync(filePath);
  if ((mode & 0o077) !== 0) {
    console.error(
      `Warning: ${filePath} is readable by group/other. Run 'chmod 600 ${filePath}' to restrict access.`,
    );
  }
}

/**
 * Find the encryption key from environment variable or .env.keys file
 */
function findKey(envFilePath: string): { key: Buffer; source: "env" | "file" } | null {
  // First, check environment variable
  const envKey = process.env[ENV_VAR_NAME];
  if (envKey) {
    return { key: parseKey(envKey), source: "env" };
  }

  // Then, check .env.keys file
  const keysPath = getKeysFilePath(envFilePath);
  if (fs.existsSync(keysPath)) {
    assertSecurePermissions(keysPath);

    const content = fs.readFileSync(keysPath, "utf8");
    const { entries } = parseEnvFile(content);
    const fileKey = entries.get(ENV_VAR_NAME);
    if (fileKey) {
      return { key: parseKey(fileKey), source: "file" };
    }
  }

  return null;
}

/**
 * Native AES-256-GCM storage implementation
 */
export const nativeAesStorage: OtplibxStorage = {
  async status(filePath: string): Promise<StorageStatus> {
    const envExists = fs.existsSync(filePath);
    const keysPath = getKeysFilePath(filePath);
    const keysExists = fs.existsSync(keysPath);
    const envKeyExists = !!process.env[ENV_VAR_NAME];

    let keySource: "env" | "file" | null = null;
    if (envKeyExists) {
      keySource = "env";
    } else if (keysExists) {
      const content = fs.readFileSync(keysPath, "utf8");
      const { entries } = parseEnvFile(content);
      if (entries.has(ENV_VAR_NAME)) {
        keySource = "file";
      }
    }

    return {
      initialized: envExists && keySource !== null,
      keySource,
      envPath: envExists ? filePath : null,
      keysPath: keysExists ? keysPath : null,
    };
  },

  async init(filePath: string): Promise<void> {
    // Check if already initialized
    if (fs.existsSync(filePath)) {
      throw new OtplibxStorageError(
        `File already exists: ${filePath}`,
        ErrorCodes.ALREADY_INITIALIZED,
      );
    }

    // Generate a new encryption key
    const key = generateKey();
    const keysPath = getKeysFilePath(filePath);

    // Write the keys file with restricted permissions
    let keysContent = "";
    if (fs.existsSync(keysPath)) {
      keysContent = fs.readFileSync(keysPath, "utf8");
    }

    const existingEntries = parseEnvFile(keysContent);
    existingEntries.entries.set(ENV_VAR_NAME, key);
    const newKeysContent = serializeEnvFile(keysContent, existingEntries.entries);

    writeSecretFile(keysPath, newKeysContent + "\n");

    // Create the empty env file with restricted permissions
    writeSecretFile(filePath, "");
  },

  async load(filePath: string): Promise<Record<string, string>> {
    if (!fs.existsSync(filePath)) {
      throw new OtplibxStorageError(`File not found: ${filePath}`, ErrorCodes.FILE_NOT_FOUND);
    }

    warnIfInsecurePermissions(filePath);

    const keyResult = findKey(filePath);
    if (!keyResult) {
      throw new OtplibxStorageError(
        `No encryption key found. Set ${ENV_VAR_NAME} environment variable or run 'otplibx init'`,
        ErrorCodes.NOT_INITIALIZED,
      );
    }

    const content = fs.readFileSync(filePath, "utf8");
    const { entries } = parseEnvFile(content);

    const result: Record<string, string> = {};
    for (const [key, value] of entries) {
      result[key] = decrypt(value, keyResult.key);
    }

    return result;
  },

  async set(filePath: string, key: string, value: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new OtplibxStorageError(`File not found: ${filePath}`, ErrorCodes.FILE_NOT_FOUND);
    }

    const keyResult = findKey(filePath);
    if (!keyResult) {
      throw new OtplibxStorageError(
        `No encryption key found. Set ${ENV_VAR_NAME} environment variable or run 'otplibx init'`,
        ErrorCodes.NOT_INITIALIZED,
      );
    }

    const content = fs.readFileSync(filePath, "utf8");
    const { entries } = parseEnvFile(content);

    // Encrypt the value (empty values are used for "remove" operations)
    if (value === "") {
      entries.delete(key);
    } else {
      const encryptedValue = encrypt(value, keyResult.key);
      entries.set(key, encryptedValue);
    }

    const newContent = serializeEnvFile(content, entries);
    writeSecretFile(filePath, newContent);
  },

  async remove(filePath: string, key: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      throw new OtplibxStorageError(`File not found: ${filePath}`, ErrorCodes.FILE_NOT_FOUND);
    }

    const content = fs.readFileSync(filePath, "utf8");
    const { entries } = parseEnvFile(content);
    entries.delete(key);

    const newContent = serializeEnvFile(content, entries);
    writeSecretFile(filePath, newContent);
  },
};

export default nativeAesStorage;
