/**
 * @otplib/totp
 *
 * TOTP class wrapper for convenient API
 */

import {
  generateSecret as generateSecretCore,
  requireCryptoPlugin,
  requireBase32Plugin,
  requireSecret,
  requireLabel,
  requireIssuer,
  requireBase32String,
  createGuardrails,
} from "@otplib/core";
import { generateTOTP as generateTOTPURI } from "@otplib/uri";

import { generate as generateCode, verify as verifyCode } from "./index.js";

import type { VerifyResult, TOTPOptions, TOTPVerifyOptions } from "./types.js";
import type { OTPGuardrails } from "@otplib/core";

/**
 * TOTP class for time-based one-time password generation
 *
 * @example
 * ```typescript
 * import { TOTP } from '@otplib/totp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const totp = new TOTP({
 *   issuer: 'MyApp',
 *   label: 'user@example.com',
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 * });
 *
 * const secret = totp.generateSecret();
 * const token = await totp.generate();
 * const isValid = await totp.verify(token);
 * ```
 */
export class TOTP {
  private readonly options: TOTPOptions;
  private readonly guardrails: OTPGuardrails;

  constructor(options: TOTPOptions = {}) {
    this.options = options;
    this.guardrails = createGuardrails(options.guardrails);
  }

  /**
   * Generate a random Base32-encoded secret
   *
   * @returns Base32-encoded secret
   */
  generateSecret(): string {
    const { crypto, base32 } = this.options;

    requireCryptoPlugin(crypto);
    requireBase32Plugin(base32);

    return generateSecretCore({ crypto, base32 });
  }

  /**
   * Generate a TOTP code
   *
   * @param options - Optional overrides
   * @returns The TOTP code
   */
  async generate(options?: Partial<TOTPOptions>): Promise<string> {
    const mergedOptions = { ...this.options, ...options };
    const {
      secret,
      crypto,
      base32,
      algorithm = "sha1",
      digits = 6,
      period = 30,
      epoch,
      t0 = 0,
    } = mergedOptions;

    requireSecret(secret);
    requireCryptoPlugin(crypto);

    // Use class guardrails, or override if provided in options
    const guardrails = options?.guardrails ?? this.guardrails;

    return generateCode({
      secret,
      algorithm,
      digits,
      period,
      epoch: epoch ?? Math.floor(Date.now() / 1000),
      t0,
      crypto,
      base32,
      guardrails,
    });
  }

  /**
   * Verify a TOTP code
   *
   * @param token - The token to verify
   * @param options - Optional verification options
   * @returns Verification result with validity and optional delta
   */
  async verify(
    token: string,
    options?: Partial<Omit<TOTPVerifyOptions, "token">>,
  ): Promise<VerifyResult> {
    const mergedOptions = { ...this.options, ...options };
    const {
      secret,
      crypto,
      base32,
      algorithm = "sha1",
      digits = 6,
      period = 30,
      epoch,
      t0 = 0,
      epochTolerance = 0,
      afterTimeStep,
    } = mergedOptions;

    requireSecret(secret);
    requireCryptoPlugin(crypto);

    // Use class guardrails, or override if provided in options
    const guardrails = options?.guardrails ?? this.guardrails;

    return verifyCode({
      secret,
      token,
      algorithm,
      digits,
      period,
      epoch: epoch ?? Math.floor(Date.now() / 1000),
      t0,
      epochTolerance,
      afterTimeStep,
      crypto,
      base32,
      guardrails,
    });
  }

  /**
   * Generate an otpauth:// URI for QR codes
   *
   * When called with parameters, merges them with instance options.
   * This preserves algorithm, digits, and period settings from the instance
   * while allowing label, issuer, and secret to be overridden.
   *
   * @param options - Optional overrides for label, issuer, and secret
   * @returns The otpauth:// URI
   *
   * @example Without parameters (uses instance settings)
   * ```typescript
   * const totp = new TOTP({
   *   label: 'user@example.com',
   *   issuer: 'MyApp',
   *   secret: 'JBSWY3DPEHPK3PXP',
   *   crypto: new NodeCryptoPlugin(),
   *   base32: new ScureBase32Plugin(),
   * });
   * const uri = totp.toURI();
   * ```
   *
   * @example With parameters (overrides instance settings)
   * ```typescript
   * const totp = new TOTP({
   *   algorithm: 'sha256',
   *   digits: 8,
   *   crypto: new NodeCryptoPlugin(),
   *   base32: new ScureBase32Plugin(),
   * });
   * // Uses instance's algorithm and digits with provided label/issuer/secret
   * const uri = totp.toURI({
   *   label: 'user@example.com',
   *   issuer: 'MyApp',
   *   secret: 'JBSWY3DPEHPK3PXP',
   * });
   * ```
   */
  toURI(options?: { label?: string; issuer?: string; secret?: string }): string {
    const {
      issuer: instanceIssuer,
      label: instanceLabel,
      secret: instanceSecret,
      algorithm = "sha1",
      digits = 6,
      period = 30,
    } = this.options;

    // Merge provided parameters with instance options
    const finalLabel = options?.label ?? instanceLabel;
    const finalIssuer = options?.issuer ?? instanceIssuer;
    const finalSecret = options?.secret ?? instanceSecret;

    requireSecret(finalSecret);
    requireLabel(finalLabel);
    requireIssuer(finalIssuer);
    requireBase32String(finalSecret);

    return generateTOTPURI({
      issuer: finalIssuer,
      label: finalLabel,
      secret: finalSecret,
      algorithm,
      digits,
      period,
    });
  }
}
