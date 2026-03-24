import type { HashAlgorithm } from "./types.js";

/**
 * Portable OTP account entry — the kind of thing stored in an authenticator app.
 */
export type OTPAccount = {
  /** OTP type */
  readonly type: "totp" | "hotp";

  /** Shared secret, Base32 encoded */
  readonly secret: string;

  /** Display name / account identifier (e.g. "user@example.com") */
  readonly name?: string;

  /** Issuer / service name (e.g. "GitHub") */
  readonly issuer?: string;

  /** Hash algorithm. Default: 'sha1' */
  readonly algorithm?: HashAlgorithm;

  /** Number of digits in OTP code. Default: 6 */
  readonly digits?: number;

  /** TOTP time step in seconds. Default: 30. Only relevant when type is 'totp'. */
  readonly period?: number;

  /** HOTP counter value. Only relevant when type is 'hotp'. */
  readonly counter?: number;
};

/**
 * Options returned by accountToOptions — a union that covers both TOTP and HOTP use cases.
 */
export type AccountOptions = {
  readonly secret: string;
  readonly algorithm: HashAlgorithm;
  readonly digits: number;
  readonly period?: number;
  readonly counter?: number;
  readonly issuer?: string;
  readonly label?: string;
};

/**
 * Extract options from an OTPAccount for use with generate() / verify().
 *
 * Maps OTPAccount fields to the option shapes expected by @otplib/totp and @otplib/hotp.
 * The secret remains as a Base32 string — the TOTP/HOTP functions handle decoding
 * when a base32 plugin is provided.
 *
 * @param account - The OTP account to convert
 * @returns Options object suitable for passing to generate/verify functions
 */
export function accountToOptions(account: OTPAccount): AccountOptions {
  const { secret, algorithm = "sha1", digits = 6, name, issuer } = account;

  const options: AccountOptions = {
    secret,
    algorithm,
    digits,
    ...(issuer !== undefined && { issuer }),
    ...(name !== undefined && { label: name }),
  };

  if (account.type === "totp") {
    return { ...options, period: account.period ?? 30 };
  }

  return { ...options, counter: account.counter ?? 0 };
}
