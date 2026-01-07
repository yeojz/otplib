/**
 * TypeScript Utility Types for otplib
 *
 * These types enhance developer experience by providing:
 * - Branded types for type-safe string handling
 * - Type guards for discriminated unions
 * - Helper types for option extraction
 */

import type { CryptoPlugin, Base32Plugin } from "./types";

/**
 * Brand type for creating nominal types from primitives
 *
 * @example
 * ```ts
 * type UserId = Brand<string, 'UserId'>;
 * const id: UserId = 'abc' as UserId;
 * ```
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Branded string type for Base32-encoded secrets
 *
 * Use this type to distinguish Base32-encoded secrets from regular strings
 * at compile time, preventing accidental misuse.
 *
 * @example
 * ```ts
 * import type { Base32Secret } from '@otplib/core';
 *
 * function processSecret(secret: Base32Secret): void {
 *   // TypeScript ensures only Base32Secret values are passed
 * }
 *
 * const secret = authenticator.generateSecret() as Base32Secret;
 * processSecret(secret); // OK
 * processSecret('random-string'); // Type error
 * ```
 */
export type Base32Secret = Brand<string, "Base32Secret">;

/**
 * Branded string type for OTP tokens
 *
 * Use this type to distinguish OTP tokens from regular strings
 * at compile time, preventing accidental misuse.
 *
 * @example
 * ```ts
 * import type { OTPToken } from '@otplib/core';
 *
 * function validateToken(token: OTPToken): boolean {
 *   // TypeScript ensures only OTPToken values are passed
 * }
 *
 * const token = await totp.generate() as OTPToken;
 * validateToken(token); // OK
 * validateToken('123456'); // Type error
 * ```
 */
export type OTPToken = Brand<string, "OTPToken">;

/**
 * Helper type to make all properties of T required except those in K
 *
 * @example
 * ```ts
 * type Options = { a?: string; b?: number; c?: boolean };
 * type RequiredAB = RequireKeys<Options, 'a' | 'b'>;
 * // { a: string; b: number; c?: boolean }
 * ```
 */
export type RequireKeys<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Helper type to make all properties of T optional except those in K
 *
 * @example
 * ```ts
 * type Options = { a: string; b: number; c: boolean };
 * type OptionalBC = OptionalKeys<Options, 'b' | 'c'>;
 * // { a: string; b?: number; c?: boolean }
 * ```
 */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the plugin configuration from an options type
 *
 * @example
 * ```ts
 * type Plugins = PluginConfig<TOTPOptions>;
 * // { crypto: CryptoPlugin; base32?: Base32Plugin }
 * ```
 */
export type PluginConfig<T> = T extends { crypto?: CryptoPlugin; base32?: Base32Plugin }
  ? Pick<T, "crypto" | "base32">
  : never;

/**
 * Ensure an options type has plugins defined
 *
 * @example
 * ```ts
 * type ConfiguredOptions = WithRequiredPlugins<TOTPOptions>;
 * // TOTPOptions with crypto and base32 required
 * ```
 */
export type WithRequiredPlugins<T extends { crypto?: CryptoPlugin; base32?: Base32Plugin }> = T & {
  crypto: CryptoPlugin;
  base32: Base32Plugin;
};

/**
 * Options type for OTP generation (crypto required)
 *
 * @example
 * ```ts
 * type MyGenerateOptions = GenerationReady<HOTPOptions>;
 * // HOTPOptions with crypto required
 * ```
 */
export type GenerationReady<T extends { crypto?: CryptoPlugin }> = T & {
  crypto: CryptoPlugin;
};

/**
 * Type predicate to check if an object has the required plugins
 *
 * @example
 * ```ts
 * const options = getOptions();
 * if (hasPlugins(options)) {
 *   // TypeScript knows plugins are defined
 *   options.crypto.hmac(...);
 * }
 * ```
 */
export function hasPlugins<T extends { crypto?: CryptoPlugin; base32?: Base32Plugin }>(
  options: T,
): options is T & { crypto: CryptoPlugin; base32: Base32Plugin } {
  return options.crypto !== undefined && options.base32 !== undefined;
}

/**
 * Type predicate to check if an object has a crypto plugin
 *
 * @example
 * ```ts
 * if (hasCrypto(options)) {
 *   await options.crypto.hmac('sha1', key, data);
 * }
 * ```
 */
export function hasCrypto<T extends { crypto?: CryptoPlugin }>(
  options: T,
): options is T & { crypto: CryptoPlugin } {
  return options.crypto !== undefined;
}

/**
 * Type predicate to check if an object has a base32 plugin
 *
 * @example
 * ```ts
 * if (hasBase32(options)) {
 *   const decoded = options.base32.decode(secret);
 * }
 * ```
 */
export function hasBase32<T extends { base32?: Base32Plugin }>(
  options: T,
): options is T & { base32: Base32Plugin } {
  return options.base32 !== undefined;
}

/**
 * Narrow union type by a specific property value
 *
 * @example
 * ```ts
 * type Result = VerifyResultValid | VerifyResultInvalid;
 * type ValidOnly = NarrowBy<Result, 'valid', true>;
 * // VerifyResultValid
 * ```
 */
export type NarrowBy<T, K extends keyof T, V extends T[K]> = T extends { [key in K]: V }
  ? T
  : never;
