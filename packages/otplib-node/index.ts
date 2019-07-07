import crypto from 'crypto';
import {
  HashAlgorithms,
  CreateDigest,
  KeyEncodings,
  HOTP,
  HexString,
  TOTP
} from 'packages/otplib-core';
import {
  Authenticator,
  CreateRandomBytes
} from 'packages/otplib-authenticator';
import { keyDecoder, keyEncoder } from 'packages/otplib-base32/base32-codec';

const createDigest: CreateDigest = (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): HexString => {
  const hmac = crypto.createHmac(algorithm, Buffer.from(hmacKey, 'hex'));
  const digest = hmac.update(Buffer.from(counter, 'hex')).digest();
  return digest.toString('hex');
};

const createRandomBytes: CreateRandomBytes = (
  size: number,
  encoding: KeyEncodings
): string => {
  return crypto.randomBytes(size).toString(encoding);
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
