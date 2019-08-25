import crypto from 'crypto';
import {
  KeyEncodings,
  HashAlgorithms,
  HexString,
  CreateDigest
} from 'otplib-hotp';
import { CreateRandomBytes } from 'otplib-authenticator';

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
