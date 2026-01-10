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
   * Hash algorithm (default: sha1)
   * Note: Google Authenticator only supports sha1
   */
  readonly algorithm?: HashAlgorithm;

  /**
   * Number of digits (default: 6)
   * Google Authenticator supports 6 or 8
   */
  readonly digits?: Digits;

  /**
   * Initial counter value for HOTP (default: 0)
   */
  readonly counter?: number;

  /**
   * Time step in seconds for TOTP (default: 30)
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
  constructor(message: string) {
    super(message);
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
  constructor(param: string, value: string) {
    super(`Invalid value for parameter '${param}': ${value}`);
    this.name = "InvalidParameterError";
  }
}
