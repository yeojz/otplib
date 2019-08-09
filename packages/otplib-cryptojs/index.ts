import { Hashes } from 'crypto-js';
import cryptoJsCore from 'crypto-js/core';
import SHA1 from 'crypto-js/hmac-sha1';
import SHA256 from 'crypto-js/hmac-sha256';
import SHA512 from 'crypto-js/hmac-sha512';
import Hex from 'crypto-js/enc-hex';
import {
  CreateDigest,
  HOTP,
  HashAlgorithms,
  HexString,
  KeyEncodings,
  TOTP,
  objectValues
} from 'otplib-core';
import { Authenticator, CreateRandomBytes } from 'otplib-authenticator';

const HASH_ALGORITHMS = objectValues<typeof HashAlgorithms>(HashAlgorithms);
const { WordArray } = cryptoJsCore.lib;

function cryptoEncoder(
  algorithm: HashAlgorithms
): Hashes['HmacSHA1'] | Hashes['HmacSHA256'] | Hashes['HmacSHA512'] {
  switch (algorithm) {
    case HashAlgorithms.SHA1:
      return SHA1;
    case HashAlgorithms.SHA256:
      return SHA256;
    case HashAlgorithms.SHA512:
      return SHA512;
    default:
      throw new Error(
        `Expecting argument 0 to be one of ${HASH_ALGORITHMS.join(
          ', '
        )}. Received ${algorithm}.`
      );
  }
}

const createDigest: CreateDigest = (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): HexString => {
  const encoder = cryptoEncoder(algorithm);
  const message = Hex.parse(counter);
  const secret = Hex.parse(hmacKey);
  return String(encoder(message, secret));
};

const createRandomBytes: CreateRandomBytes = (
  numberOfBytes: number,
  encoding: KeyEncodings
): string => {
  const words = WordArray.random(numberOfBytes);
  return Buffer.from(words.toString(), 'hex').toString(encoding);
};

export const hotp = new HOTP({
  createDigest
});

export const totp = new TOTP({
  createDigest
});

export const authenticator = new Authenticator({
  createDigest,
  createRandomBytes
});
