/**
 * otplib-preset-browser
 *
 * Provides fully initialised classes that are targeted
 * for a browser build.
 *
 * Uses:
 *
 * - Base32: 'plugin-base32-enc-dec'
 * - Crypto: 'plugin-crypto-js'
 */
import { createDigest, createRandomBytes } from 'otplib-plugin-crypto-js';
import { keyDecoder, keyEncoder } from 'otplib-plugin-base32-enc-dec';
import { HOTP, TOTP, Authenticator } from 'otplib-core';

// @ts-ignore
if (typeof window === 'object' && typeof window.Buffer === 'undefined') {
  // @ts-ignore
  window.Buffer = buffer.Buffer; /* globals buffer */
}

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
