import crypto from 'crypto';
import {
  HashAlgorithms,
  CreateDigest,
  HOTP,
  HexString,
  KeyEncodings,
  TOTP
} from 'otplib-core';
import { Authenticator, CreateRandomBytes } from 'otplib-authenticator';

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

/**
 * A HOTP instance.
 *
 * Initialised with package-specific implementation of:
 *
 * - createDigest
 */
export const hotp = new HOTP({
  createDigest
});

/**
 * A TOTP instance.
 *
 * Initialised with package-specific implementation of:
 *
 * - createDigest
 */
export const totp = new TOTP({
  createDigest
});

/**
 * An Authenticator instance.
 *
 * Initialised with package-specific implementation of:
 *
 * - createDigest
 * - createRandomBytes
 */
export const authenticator = new Authenticator({
  createDigest,
  createRandomBytes
});
