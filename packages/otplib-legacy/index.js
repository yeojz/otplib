import { authenticator as base } from 'otplib-node';
import { keyEncoder, keyDecoder } from 'otplib-base32/thirty-two';
import { HOTP, TOTP, Authenticator } from './legacy';

const { createDigest, createRandomBytes } = base.options;

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
