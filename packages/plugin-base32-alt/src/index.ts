/**
 * @otplib/plugin-base32-alt
 *
 * Alternative encoding plugins for otplib - use secrets without Base32 encoding.
 */
import { createBase32Plugin, stringToBytes, bytesToString } from "@otplib/core";

import { bytesToBase64, base64ToBytes, bytesToHex, hexToBytes } from "./utils.js";

import type { Base32Plugin } from "@otplib/core";

/**
 * UTF-8 string bypass - treats secrets as plain text
 *
 * Use this when your secret is a plain text string that should be
 * converted directly to bytes without Base32 encoding.
 *
 * @example
 * ```ts
 * import { bypassAsString } from '@otplib/plugin-base32-alt';
 * import { generate } from '@otplib/totp';
 *
 * await generate({ secret: "mysecretkey", base32: bypassAsString, crypto });
 * ```
 */
export const bypassAsString: Base32Plugin = createBase32Plugin({
  name: "bypass-as-string",
  encode: bytesToString,
  decode: stringToBytes,
});

/**
 * Hex string bypass - treats secrets as hex-encoded strings
 *
 * Use this when your secret is a hex string that should be
 * converted directly to bytes without Base32 encoding.
 *
 * @example
 * ```ts
 * import { bypassAsHex } from '@otplib/plugin-base32-alt';
 * import { generate } from '@otplib/totp';
 *
 * await generate({ secret: "48656c6c6f", base32: bypassAsHex, crypto });
 * ```
 */
export const bypassAsHex: Base32Plugin = createBase32Plugin({
  name: "bypass-as-hex",
  encode: bytesToHex,
  decode: hexToBytes,
});

/**
 * Alias for bypassAsHex - base16 is the formal name for hex encoding
 */
export const bypassAsBase16: Base32Plugin = bypassAsHex;

/**
 * Base64 string bypass - treats secrets as base64-encoded strings
 *
 * Use this when your secret is a base64 string that should be
 * converted directly to bytes without Base32 encoding.
 *
 * @example
 * ```ts
 * import { bypassAsBase64 } from '@otplib/plugin-base32-alt';
 * import { generate } from '@otplib/totp';
 *
 * await generate({ secret: "SGVsbG8=", base32: bypassAsBase64, crypto });
 * ```
 */
export const bypassAsBase64: Base32Plugin = createBase32Plugin({
  name: "bypass-as-base64",
  encode: bytesToBase64,
  decode: base64ToBytes,
});

// Re-export factory for custom bypasses
export { createBase32Plugin } from "@otplib/core";
export type { CreateBase32PluginOptions } from "@otplib/core";
