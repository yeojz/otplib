// @ts-ignore
import createHmac from 'create-hmac/browser';
import {
  HashAlgorithms,
  CreateDigest,
  KeyEncodings,
  HexString,
  HOTP,
  TOTP
} from 'packages/otplib-core';
import {
  CreateRandomBytes,
  Authenticator
} from 'packages/otplib-authenticator';
import { keyDecoder, keyEncoder } from 'packages/otplib-base32/base32-codec';

const createDigest: CreateDigest = (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): HexString => {
  const hmac = createHmac(algorithm, Buffer.from(hmacKey, 'hex'));
  const digest = hmac.update(Buffer.from(counter, 'hex')).digest();
  return digest.toString('hex');
};

const createRandomBytes: CreateRandomBytes = (
  size: number,
  encoding: KeyEncodings
): string => {
  // @ts-ignore
  const crypto = window.crypto || window.msCrypto;

  if (!crypto || typeof crypto.getRandomValues !== 'function') {
    throw new Error(
      'Unable to load crypto module. You may be on an older browser'
    );
  }

  if (size > 65536) {
    throw new Error('Requested size of random bytes is too large');
  }

  if (size < 1) {
    throw new Error('Requested size must be more than 0');
  }

  const rawBytes = new Uint8Array(size);
  crypto.getRandomValues(rawBytes);

  return Buffer.from(rawBytes.buffer).toString(encoding);
};

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
