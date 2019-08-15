/**
 * otplib-preset-default
 *
 * Provides fully initialised classes that is targeted
 * at the node environment. This is meant for getting started
 * quickly.
 *
 * If you want to use your own Base32 and/or crypto plugin, it
 * would be better to create a new file in your project and initialise
 * the core classes manually.
 *
 * Uses:
 *
 * - Base32: 'plugin-thirty-two'
 * - Crypto: 'plugin-crypto'
 */
import { createDigest, createRandomBytes } from 'otplib-plugin-crypto';
import { keyDecoder, keyEncoder } from 'otplib-plugin-thirty-two';
import { HOTP, TOTP, Authenticator } from 'otplib-core';

export const hotp = new HOTP({
  createDigest
});

export const totp = new TOTP({
  createDigest
});

export const authenticator = new Authenticator({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder
});
