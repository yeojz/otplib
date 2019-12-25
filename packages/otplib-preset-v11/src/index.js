/**
 * otplib-preset-legacy
 *
 * Target: otplib@v11.x
 *
 * Provides legacy class bindings for the target version of otplib.
 * Backported class and methods will log a warning on use.
 *
 * Uses:
 *
 * - Base32: 'plugin-thirty-two'
 * - Crypto: 'plugin-crypto'
 */
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import { keyEncoder, keyDecoder } from '@otplib/plugin-thirty-two';
import { HOTP, TOTP, Authenticator } from './v11';

export const hotp = new HOTP({
  createDigest
});

export const totp = new TOTP({
  createDigest
});

export const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyEncoder,
  keyDecoder
});
