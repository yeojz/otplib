/* eslint-disable @typescript-eslint/ban-ts-ignore */
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
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto-js';
import { keyDecoder, keyEncoder } from '@otplib/plugin-base32-enc-dec';
import {
  Authenticator,
  AuthenticatorOptions,
  HOTP,
  HOTPOptions,
  TOTP,
  TOTPOptions
} from '@otplib/core';

// @ts-ignore
if (typeof window === 'object' && typeof window.Buffer === 'undefined') {
  // @ts-ignore
  window.Buffer = buffer.Buffer; /* globals buffer */
}

export const hotp = new HOTP<HOTPOptions>({
  createDigest
});

export const totp = new TOTP<TOTPOptions>({
  createDigest
});

export const authenticator = new Authenticator<AuthenticatorOptions>({
  createDigest,
  createRandomBytes,
  keyDecoder,
  keyEncoder
});
