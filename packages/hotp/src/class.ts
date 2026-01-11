/**
 * @otplib/hotp
 *
 * HOTP class wrapper for convenient API
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
import { generateHOTP as generateHOTPURI } from "@otplib/uri";

import { generate as generateCode, verify as verifyCode } from "./index";

import type { VerifyResult, HOTPOptions } from "./types";
import type { OTPGuardrails } from "@otplib/core";

/**
 * HOTP class for HMAC-based one-time password generation
 *
 * @example
 * ```typescript
 * import { HOTP } from '@otplib/hotp';
 * import { NodeCryptoPlugin } from '@otplib/plugin-crypto-node';
 * import { ScureBase32Plugin } from '@otplib/plugin-base32-scure';
 *
 * const hotp = new HOTP({
 *   issuer: 'MyApp',
 *   label: 'user@example.com',
 *   counter: 0,
 *   crypto: new NodeCryptoPlugin(),
 *   base32: new ScureBase32Plugin(),
 * });
 *
 * const secret = hotp.generateSecret();
 * const token = await hotp.generate(0);
 * const isValid = await hotp.verify({ token, counter: 0 });
 * ```
 */
export class HOTP {
  private readonly options: HOTPOptions;
  private readonly guardrails: Readonly<OTPGuardrails>;

  constructor(options: HOTPOptions = {}) {
    this.options = options;
    this.guardrails = options.guardrails ?? createGuardrails();
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
   * Generate an HOTP code for a specific counter
   *
   * @param counter - The counter value
   * @param options - Optional overrides
   * @returns The HOTP code
   */
  async generate(counter: number, options?: Partial<HOTPOptions>): Promise<string> {
    const mergedOptions = { ...this.options, ...options };

    const { secret, crypto, base32, algorithm = "sha1", digits = 6 } = mergedOptions;

    requireSecret(secret);
    requireCryptoPlugin(crypto);
    requireBase32Plugin(base32);

    // Use class guardrails, or override if provided in options
    const guardrails = options?.guardrails ?? this.guardrails;

    return generateCode({
      secret,
      counter,
      algorithm,
      digits,
      crypto,
      base32,
      guardrails,
    });
  }

  /**
   * Verify an HOTP code
   *
   * @param params - Verification parameters
   * @param options - Optional verification options
   * @returns Verification result with validity and optional delta
   */
  async verify(
    params: { token: string; counter: number },
    options?: Partial<HOTPOptions & { counterTolerance?: number | number[] }>,
  ): Promise<VerifyResult> {
    const mergedOptions = { ...this.options, ...options };

    const {
      secret,
      crypto,
      base32,
      algorithm = "sha1",
      digits = 6,
      counterTolerance = 0,
    } = mergedOptions;

    requireSecret(secret);
    requireCryptoPlugin(crypto);
    requireBase32Plugin(base32);

    // Use class guardrails, or override if provided in options
    const guardrails = options?.guardrails ?? this.guardrails;

    return verifyCode({
      secret,
      token: params.token,
      counter: params.counter,
      algorithm,
      digits,
      counterTolerance,
      crypto,
      base32,
      guardrails,
    });
  }

  /**
   * Generate an otpauth:// URI for QR codes
   *
   * @param counter - The counter value
   * @returns The otpauth:// URI
   */
  toURI(counter: number = 0): string {
    const { issuer, label, secret, algorithm = "sha1", digits = 6 } = this.options;

    requireSecret(secret);
    requireLabel(label);
    requireIssuer(issuer);
    requireBase32String(secret);

    return generateHOTPURI({
      issuer,
      label,
      secret,
      algorithm,
      digits,
      counter,
    });
  }
}
