/* eslint-disable @typescript-eslint/ban-ts-ignore */
import crypto from 'crypto';
// @ts-ignore
import cryptoAsync from '@ronomon/crypto-async';
import {
  CreateDigest,
  CreateRandomBytes,
  HashAlgorithms,
  HexString,
  KeyEncodings
} from 'otplib-core';

export const createDigest: CreateDigest<Promise<string>> = async (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): Promise<HexString> => {
  const digest = await new Promise<Buffer>((resolve, reject): void => {
    cryptoAsync.hmac(
      algorithm,
      Buffer.from(hmacKey, 'hex'),
      Buffer.from(counter, 'hex'),
      (error: string, hmac: Buffer): void => {
        if (error) {
          reject(error);
          return;
        }
        resolve(hmac);
      }
    );
  });

  return digest.toString('hex');
};

export const createRandomBytes: CreateRandomBytes<Promise<string>> = async (
  size: number,
  encoding: KeyEncodings
): Promise<string> => {
  return crypto.randomBytes(size).toString(encoding);
};
