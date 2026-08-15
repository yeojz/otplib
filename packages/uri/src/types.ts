import type { HashAlgorithm, Digits } from "@otplib/core";

/**
 * OTP type (HOTP or TOTP)
 */
export type OTPType = "hotp" | "totp";

/**
 * otpauth:// URI parameters
 */
export type OTPAuthParams = {
  /**
   * Base32-encoded shared secret (required)
   */
  readonly secret: string;

  /**
   * Service/provider name (recommended)
   */
  readonly issuer?: string;

  /**
   * Hash algorithm. Parsing preserves absence; OTP consumers default to sha1.
   * Some authenticator apps ignore this parameter; sha1 has the widest
   * interoperability.
   */
  readonly algorithm?: HashAlgorithm;

  /**
   * Number of digits. Parsing preserves absence; OTP consumers default to 6.
   * The Key URI format defines 6 or 8; some authenticator apps ignore this
   * parameter.
   */
  readonly digits?: Digits;

  /**
   * Initial counter value for HOTP. Required by the Key URI format; parsing
   * preserves absence, while HOTP generation helpers default to 0.
   */
  readonly counter?: number;

  /**
   * Time step in seconds for TOTP. Parsing preserves absence; OTP consumers
   * default to 30.
   * Some authenticator apps ignore this parameter, so 30 has the widest
   * interoperability.
   */
  readonly period?: number;
};

/**
 * otpauth:// URI structure
 */
export type OTPAuthURI = {
  /**
   * Type of OTP (hotp or totp)
   */
  readonly type: OTPType;

  /**
   * The label (typically: issuer:account or account)
   */
  readonly label: string;

  /**
   * Parameters from the URI
   */
  readonly params: OTPAuthParams;
};

/**
 * Error thrown when URI parsing fails
 */
export class URIParseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "URIParseError";
  }
}

/**
 * Error thrown when URI is invalid
 */
export class InvalidURIError extends URIParseError {
  constructor(uri: string) {
    super(`Invalid otpauth URI: ${uri}`);
    this.name = "InvalidURIError";
  }
}

/**
 * Error thrown when URI has missing required parameters
 */
export class MissingParameterError extends URIParseError {
  constructor(param: string) {
    super(`Missing required parameter: ${param}`);
    this.name = "MissingParameterError";
  }
}

/**
 * Error thrown when URI has invalid parameter value
 */
export class InvalidParameterError extends URIParseError {
  constructor(param: string, value: string, options?: ErrorOptions) {
    super(`Invalid value for parameter '${param}': ${value}`, options);
    this.name = "InvalidParameterError";
  }
}
