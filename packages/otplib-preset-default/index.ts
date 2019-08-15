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
