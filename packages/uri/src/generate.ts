import { normalizeHashAlgorithm } from "@otplib/core";

import { InvalidParameterError } from "./types.js";

import type { OTPAuthURI } from "./types.js";
import type { HashAlgorithm, Digits } from "@otplib/core";

/**
 * Coerce a number or a strict numeric string (e.g. from parsed JSON or a
 * database row) into a safe integer within [min, max]. Mirrors parse.ts's
 * parseIntegerParameter, minus the throw - callers decide how to report a
 * rejection.
 */
function coerceInteger(
  value: unknown,
  min: number,
  max = Number.MAX_SAFE_INTEGER,
): number | undefined {
  let numeric: number;

  if (typeof value === "number") {
    numeric = value;
  } else if (typeof value === "string" && /^-?\d+$/.test(value)) {
    numeric = Number(value);
  } else {
    return undefined;
  }

  return Number.isSafeInteger(numeric) && numeric >= min && numeric <= max ? numeric : undefined;
}

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
   * Note: Some authenticator apps ignore this parameter; sha1 has the widest
   * interoperability.
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
 * @throws {AlgorithmUnsupportedError} If a non-empty algorithm is not supported
 * @throws {InvalidParameterError} If `type` is not "hotp"/"totp", or if
 * `digits`, `counter`, or `period` are present but are not a safe integer (or
 * a numeric string of one) in range - `digits` must be 6, 7 or 8 to match
 * what this package's `parse()` accepts, `counter` must be >= 0, and `period`
 * must be >= 1
 *
 * @example
 * ```ts
 * import { generate } from '@otplib/uri';
 * import { base32 } from '@otplib/plugin-base32-scure';
 *
 * const secret = base32.encode(new Uint8Array([1, 2, 3, 4, 5]));
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

  // `type` is interpolated directly into the URI below (unlike label/issuer/
  // secret, it is never percent-encoded), so untyped JS callers must be
  // stopped from smuggling extra path/query segments through it.
  if (type !== "hotp" && type !== "totp") {
    throw new InvalidParameterError("type", String(type));
  }

  // digits/counter/period commonly arrive as numeric strings (parsed JSON, a
  // database row, form data), which worked before validation existed since
  // the value was just interpolated with String(). Coerce those alongside
  // plain numbers rather than rejecting them outright.
  //
  // digits is bounded to 6-8 to match parse()'s accepted set, so generate()
  // can never produce a URI that this package's own parse() rejects.
  const digits = params.digits === undefined ? undefined : coerceInteger(params.digits, 6, 8);
  if (params.digits !== undefined && digits === undefined) {
    throw new InvalidParameterError("digits", String(params.digits));
  }

  const counter = params.counter === undefined ? undefined : coerceInteger(params.counter, 0);
  if (params.counter !== undefined && counter === undefined) {
    throw new InvalidParameterError("counter", String(params.counter));
  }

  const period = params.period === undefined ? undefined : coerceInteger(params.period, 1);
  if (params.period !== undefined && period === undefined) {
    throw new InvalidParameterError("period", String(params.period));
  }

  // Encode label parts while preserving ':' as the issuer/account separator
  const encodedLabel = label
    .split(":")
    .map((part) => encodeURIComponent(part))
    .join(":");

  let result = `otpauth://${type}/${encodedLabel}?`;

  const queryParams: string[] = [];

  if (params.secret) {
    queryParams.push(`secret=${encodeURIComponent(params.secret)}`);
  }

  if (params.issuer) {
    queryParams.push(`issuer=${encodeURIComponent(params.issuer)}`);
  }

  if (params.algorithm) {
    // Normalize first so untyped JS callers passing e.g. 'SHA1' are case-folded
    // (and invalid values rejected) before the "omit when sha1" rule is applied.
    const algorithm = normalizeHashAlgorithm(params.algorithm);

    if (algorithm !== "sha1") {
      // Mapped to the uppercase, non-dashed name the Key Uri Format requires
      // (SHA256/SHA512).
      queryParams.push(`algorithm=${algorithm.toUpperCase()}`);
    }
  }

  if (digits !== undefined && digits !== 6) {
    queryParams.push(`digits=${digits}`);
  }

  if (type === "hotp" && counter !== undefined) {
    queryParams.push(`counter=${counter}`);
  }

  if (type === "totp" && period !== undefined && period !== 30) {
    queryParams.push(`period=${period}`);
  }

  result += queryParams.join("&");

  return result;
}

/**
 * Generate a TOTP otpauth:// URI with simplified parameters
 *
 * @param options - TOTP URI generation options
 * @returns The otpauth:// URI string
 * @throws {AlgorithmUnsupportedError} If a non-empty algorithm is not supported
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
 * @throws {AlgorithmUnsupportedError} If a non-empty algorithm is not supported
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
