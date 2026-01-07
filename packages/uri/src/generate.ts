import type { OTPAuthURI } from "./types.js";
import type { HashAlgorithm, Digits } from "@otplib/core";

/**
 * Base options for URI generation
 */
export type URIOptions = {
  /**
   * Service/provider name (e.g., 'ACME Co', 'GitHub', 'AWS')
   */
  issuer?: string;

  /**
   * Account identifier (e.g., email, username)
   */
  label?: string;

  /**
   * Base32-encoded secret key
   */
  secret: string;

  /**
   * Hash algorithm (default: 'sha1')
   * Note: Google Authenticator only supports sha1
   */
  algorithm?: HashAlgorithm;

  /**
   * Number of digits (default: 6)
   * Google Authenticator supports 6 or 8, RFC also allows 7
   */
  digits?: Digits;

  /**
   * Time step in seconds for TOTP (default: 30)
   */
  period?: number;

  /**
   * Counter value for HOTP
   */
  counter?: number;
};

/**
 * TOTP-specific URI options
 */
export type TOTPURIOptions = URIOptions & {
  period?: number;
  counter?: never;
};

/**
 * HOTP-specific URI options
 */
export type HOTPURIOptions = URIOptions & {
  period?: never;
  counter?: number;
};

/**
 * Generate an otpauth:// URI
 *
 * @param uri - The URI components
 * @returns The otpauth:// URI string
 *
 * @example
 * ```ts
 * import { generate } from '@otplib/uri';
 * import { encode } from '@otplib/base32';
 *
 * const secret = encode(new Uint8Array([1, 2, 3, 4, 5]));
 *
 * const uri = generate({
 *   type: 'totp',
 *   label: 'ACME:john@example.com',
 *   params: {
 *     secret,
 *     issuer: 'ACME',
 *     algorithm: 'sha1',
 *     digits: 6,
 *   },
 * });
 * // Returns: 'otpauth://totp/ACME:john%40example.com?secret=...'
 * ```
 */
export function generate(uri: OTPAuthURI): string {
  const { type, label, params } = uri;

  const encodedLabel = label
    .split("")
    .map((char) => {
      if (char === ":") return ":";
      return encodeURIComponent(char);
    })
    .join("");

  let result = `otpauth://${type}/${encodedLabel}?`;

  const queryParams: string[] = [];

  if (params.secret) {
    queryParams.push(`secret=${params.secret}`);
  }

  if (params.issuer) {
    queryParams.push(`issuer=${encodeURIComponent(params.issuer)}`);
  }

  if (params.algorithm && params.algorithm !== "sha1") {
    queryParams.push(`algorithm=${params.algorithm.toUpperCase()}`);
  }

  if (params.digits && params.digits !== 6) {
    queryParams.push(`digits=${params.digits}`);
  }

  if (type === "hotp" && params.counter !== undefined) {
    queryParams.push(`counter=${params.counter}`);
  }

  if (type === "totp" && params.period !== undefined && params.period !== 30) {
    queryParams.push(`period=${params.period}`);
  }

  result += queryParams.join("&");

  return result;
}

/**
 * Generate a TOTP otpauth:// URI with simplified parameters
 *
 * @param options - TOTP URI generation options
 * @returns The otpauth:// URI string
 */
export function generateTOTP(options: TOTPURIOptions & { issuer: string; label: string }): string {
  const { issuer, label: account, secret, algorithm = "sha1", digits = 6, period = 30 } = options;

  const fullLabel = issuer ? `${issuer}:${account}` : account;

  return generate({
    type: "totp",
    label: fullLabel,
    params: {
      secret,
      issuer,
      algorithm,
      digits,
      period,
    },
  });
}

/**
 * Generate a HOTP otpauth:// URI with simplified parameters
 *
 * @param options - HOTP URI generation options
 * @returns The otpauth:// URI string
 */
export function generateHOTP(options: HOTPURIOptions & { issuer: string; label: string }): string {
  const { issuer, label: account, secret, counter = 0, algorithm = "sha1", digits = 6 } = options;

  const fullLabel = issuer ? `${issuer}:${account}` : account;

  return generate({
    type: "hotp",
    label: fullLabel,
    params: {
      secret,
      issuer,
      algorithm,
      digits,
      counter,
    },
  });
}
