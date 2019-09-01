import crypto from 'crypto';
import {
  CreateDigest,
  CreateRandomBytes,
  HashAlgorithms,
  HexString,
  KeyEncodings
} from 'otplib-core';

export const createDigest: CreateDigest = (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): HexString => {
  const hmac = crypto.createHmac(algorithm, Buffer.from(hmacKey, 'hex'));
  const digest = hmac.update(Buffer.from(counter, 'hex')).digest();
  return digest.toString('hex');
};

export const createRandomBytes: CreateRandomBytes = (
  size: number,
  encoding: KeyEncodings
): string => {
  return crypto.randomBytes(size).toString(encoding);
};
