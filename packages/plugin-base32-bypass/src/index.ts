/**
 * @otplib/plugin-base32-bypass
 *
 * Bypass plugins for otplib - use raw string secrets without Base32 encoding.
 */

import { createBase32Plugin, stringToBytes, bytesToString } from "@otplib/core";

import type { Base32Plugin } from "@otplib/core";

/**
 * UTF-8 string bypass - treats secrets as plain text
 *
 * Use this when your secret is a plain text string that should be
 * converted directly to bytes without Base32 encoding.
 *
 * @example
 * ```ts
 * import { stringBypass } from '@otplib/plugin-base32-bypass';
 * import { generate } from '@otplib/totp';
 *
 * await generate({ secret: "mysecretkey", base32: stringBypass, crypto });
 * ```
 */
export const stringBypass: Base32Plugin = createBase32Plugin({
  name: "string-bypass",
  encode: bytesToString,
  decode: stringToBytes,
});

// Re-export factory for custom bypasses
export { createBase32Plugin } from "@otplib/core";
export type { CreateBase32PluginOptions } from "@otplib/core";
