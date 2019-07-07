import Crypto, { Hashes } from 'crypto-js';
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

type Encoder = Hashes['HmacSHA1'] | Hashes['HmacSHA256'] | Hashes['HmacSHA512'];

function getEncoder(algorithm: HashAlgorithms): Encoder {
  switch (algorithm) {
    case 'sha1':
      return Crypto.HmacSHA1;
    case 'sha256':
      return Crypto.HmacSHA256;
    case 'sha512':
      return Crypto.HmacSHA512;
    default:
      throw new Error(
        `Unsupported algorithm ${algorithm}. Accepts: sha1, sha256, sha512`
      );
  }
}

const createDigest: CreateDigest = (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): HexString => {
  const encoder = getEncoder(algorithm);
  const message = Crypto.enc.Hex.parse(counter);
  const secret = Crypto.enc.Hex.parse(hmacKey);
  return String(encoder(message, secret));
};

const createRandomBytes: CreateRandomBytes = (
  numberOfBytes: number,
  encoding: KeyEncodings
): string => {
  const words = Crypto.lib.WordArray.random(numberOfBytes);
  const rand = Crypto.enc.Hex.stringify(words);
  return Buffer.from(rand, 'hex').toString(encoding);
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
