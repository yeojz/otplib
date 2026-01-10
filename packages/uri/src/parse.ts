import { InvalidURIError, InvalidParameterError } from "./types.js";

import type { OTPAuthURI, OTPAuthParams } from "./types.js";
import type { HashAlgorithm, Digits } from "@otplib/core";

// Security limits to prevent DoS attacks
const MAX_URI_LENGTH = 2048; // Standard URL length limit
const MAX_LABEL_LENGTH = 512;
const MAX_PARAM_VALUE_LENGTH = 1024;

/**
 * Format error message for caught errors
 * @internal
 */
export function formatErrorMessage(error: unknown, context: string): string {
  const errorStr = error instanceof Error ? error.message : String(error);
  return `Invalid URI encoding in ${context}: ${errorStr}`;
}

/**
 * Safely decode a URI component with length validation and error handling
 * @throws {InvalidURIError} If decoding fails or length exceeds limit
 */
function safeDecodeURIComponent(str: string, maxLength: number, context: string): string {
  if (str.length > maxLength * 3) {
    throw new InvalidURIError(`${context} exceeds maximum length`);
  }

  try {
    const decoded = decodeURIComponent(str);
    if (decoded.length > maxLength) {
      throw new InvalidURIError(`${context} exceeds maximum length of ${maxLength} characters`);
    }
    return decoded;
  } catch (error) {
    if (error instanceof InvalidURIError) {
      throw error;
    }
    throw new InvalidURIError(formatErrorMessage(error, context));
  }
}

/**
 * Parse an otpauth:// URI into its components
 *
 * @param uri - The otpauth:// URI to parse
 * @returns Parsed URI components
 * @throws {InvalidURIError} If URI is invalid
 * @throws {MissingParameterError} If required parameters are missing
 * @throws {InvalidParameterError} If parameter values are invalid
 *
 * @example
 * ```ts
 * import { parse } from '@otplib/uri';
 *
 * const uri = 'otpauth://totp/ACME:john@example.com?secret=JBSWY3DPEHPK3PXP&issuer=ACME';
 * const parsed = parse(uri);
 * // {
 * //   type: 'totp',
 * //   label: 'ACME:john@example.com',
 * //   params: { secret: 'JBSWY3DPEHPK3PXP', issuer: 'ACME' }
 * // }
 * ```
 */
export function parse(uri: string): OTPAuthURI {
  if (uri.length > MAX_URI_LENGTH) {
    throw new InvalidURIError(`URI exceeds maximum length of ${MAX_URI_LENGTH} characters`);
  }

  if (!uri.startsWith("otpauth://")) {
    throw new InvalidURIError(uri);
  }

  const withoutScheme = uri.slice("otpauth://".length);
  const slashIndex = withoutScheme.indexOf("/");

  if (slashIndex === -1) {
    throw new InvalidURIError(uri);
  }

  const type = withoutScheme.slice(0, slashIndex);
  if (type !== "hotp" && type !== "totp") {
    throw new InvalidParameterError("type", type);
  }

  const remaining = withoutScheme.slice(slashIndex + 1);
  const queryIndex = remaining.indexOf("?");

  let label: string;
  let queryString: string;

  if (queryIndex === -1) {
    label = safeDecodeURIComponent(remaining, MAX_LABEL_LENGTH, "label");
    queryString = "";
  } else {
    label = safeDecodeURIComponent(remaining.slice(0, queryIndex), MAX_LABEL_LENGTH, "label");
    queryString = remaining.slice(queryIndex + 1);
  }

  const params = parseQueryString(queryString);

  return {
    type,
    label,
    params,
  };
}

/**
 * Parse query string into parameters object
 */
function parseQueryString(queryString: string): OTPAuthParams {
  // Use mutable type during construction
  const params: {
    secret?: string;
    issuer?: string;
    algorithm?: HashAlgorithm;
    digits?: Digits;
    counter?: number;
    period?: number;
  } = {};

  if (!queryString) {
    return params as OTPAuthParams;
  }

  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const equalIndex = pair.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }

    const key = safeDecodeURIComponent(pair.slice(0, equalIndex), 64, "parameter key");
    const value = safeDecodeURIComponent(
      pair.slice(equalIndex + 1),
      MAX_PARAM_VALUE_LENGTH,
      `parameter '${key}'`,
    );

    switch (key) {
      case "secret":
        params.secret = value;
        break;
      case "issuer":
        params.issuer = value;
        break;
      case "algorithm":
        params.algorithm = parseAlgorithm(value);
        break;
      case "digits":
        params.digits = parseDigits(value);
        break;
      case "counter":
        params.counter = parseInt(value, 10);
        break;
      case "period":
        params.period = parseInt(value, 10);
        break;
    }
  }

  return params as OTPAuthParams;
}

/**
 * Parse algorithm string
 */
function parseAlgorithm(value: string): HashAlgorithm {
  const normalized = value.toLowerCase();
  if (normalized === "sha1" || normalized === "sha-1") {
    return "sha1";
  }
  if (normalized === "sha256" || normalized === "sha-256") {
    return "sha256";
  }
  if (normalized === "sha512" || normalized === "sha-512") {
    return "sha512";
  }
  throw new InvalidParameterError("algorithm", value);
}

/**
 * Parse digits string
 */
function parseDigits(value: string): Digits {
  const digits = parseInt(value, 10);
  if (digits === 6 || digits === 7 || digits === 8) {
    return digits;
  }
  throw new InvalidParameterError("digits", value);
}
