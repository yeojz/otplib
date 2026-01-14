/**
 * @otplib/v12-adapter
 *
 * Drop-in replacement adapter for migrating from otplib v12 to v13.
 *
 * This package provides the same API as otplib v12, making it easy
 * to migrate existing codebases to v13 without breaking changes.
 *
 * @example Using pre-configured instances (v12 style)
 * ```typescript
 * import { authenticator } from '@otplib/v12-adapter';
 *
 * const secret = authenticator.generateSecret();
 * const token = authenticator.generate(secret);
 * const isValid = authenticator.check(token, secret);
 * const uri = authenticator.keyuri('user@example.com', 'MyApp', secret);
 * ```
 *
 * @example Using class instances
 * ```typescript
 * import { Authenticator } from '@otplib/v12-adapter';
 *
 * const authenticator = new Authenticator({ step: 60 });
 * const secret = authenticator.generateSecret();
 * const token = authenticator.generate(secret);
 * ```
 */

// Classes
export { HOTP } from "./hotp.js";
export { TOTP } from "./totp.js";
export { Authenticator } from "./authenticator.js";

// Functional exports (v12-style)
export { hotpDigestToToken } from "./hotp.js";

// Constants (v12-style)
export { HashAlgorithms, KeyEncodings } from "./types.js";

// Types
export type {
  HOTPOptions,
  TOTPOptions,
  AuthenticatorOptions,
  SecretKey,
  Base32SecretKey,
  CreateDigest,
  CreateHmacKey,
  CreateRandomBytes,
  KeyEncoder,
  KeyDecoder,
} from "./types.js";

// Pre-configured instances (v12 style)
import { Authenticator } from "./authenticator.js";
import { HOTP } from "./hotp.js";
import { TOTP } from "./totp.js";

/**
 * Pre-configured HOTP instance
 *
 * @example
 * ```typescript
 * import { hotp } from '@otplib/v12-adapter';
 *
 * const token = hotp.generate('JBSWY3DPEHPK3PXP', 0);
 * const isValid = hotp.check(token, 'JBSWY3DPEHPK3PXP', 0);
 * ```
 */
export const hotp = new HOTP();

/**
 * Pre-configured TOTP instance
 *
 * @example
 * ```typescript
 * import { totp } from '@otplib/v12-adapter';
 *
 * const token = totp.generate('JBSWY3DPEHPK3PXP');
 * const isValid = totp.check(token, 'JBSWY3DPEHPK3PXP');
 * ```
 */
export const totp = new TOTP();

/**
 * Pre-configured Authenticator instance
 *
 * @example
 * ```typescript
 * import { authenticator } from '@otplib/v12-adapter';
 *
 * const secret = authenticator.generateSecret();
 * const token = authenticator.generate(secret);
 * const isValid = authenticator.check(token, secret);
 * ```
 */
export const authenticator = new Authenticator();

// Re-export v13 plugins for advanced usage
export { NobleCryptoPlugin } from "@otplib/plugin-crypto-noble";
export { ScureBase32Plugin } from "@otplib/plugin-base32-scure";
