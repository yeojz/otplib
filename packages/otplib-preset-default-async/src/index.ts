/**
 * otplib-preset-default-async
 *
 * Provides fully initialised classes with async methods that are targeted
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
import { KeyDecoder, KeyEncoder } from '@otplib/core';
import {
  AuthenticatorAsync,
  AuthenticatorAsyncOptions,
  HOTPAsync,
  HOTPAsyncOptions,
  TOTPAsync,
  TOTPAsyncOptions
} from '@otplib/core-async';
import {
  createDigest,
  createRandomBytes
} from '@otplib/plugin-crypto-async-ronomon';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';

export const hotp = new HOTPAsync<HOTPAsyncOptions>({
  createDigest
});

export const totp = new TOTPAsync<TOTPAsyncOptions>({
  createDigest
});

export const authenticator = new AuthenticatorAsync<AuthenticatorAsyncOptions>({
  createDigest,
  createRandomBytes,
  keyDecoder: (keyDecoder as unknown) as KeyDecoder<Promise<string>>,
  keyEncoder: (keyEncoder as unknown) as KeyEncoder<Promise<string>>
});
