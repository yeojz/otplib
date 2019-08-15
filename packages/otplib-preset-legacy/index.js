import { createDigest, createRandomBytes } from 'otplib-plugin-crypto';
import { keyEncoder, keyDecoder } from 'otplib-plugin-thirty-two';
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
