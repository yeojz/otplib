import { Hashes } from 'crypto-js';
import cryptoJsCore from 'crypto-js/core';
import SHA1 from 'crypto-js/hmac-sha1';
import SHA256 from 'crypto-js/hmac-sha256';
import SHA512 from 'crypto-js/hmac-sha512';
import Hex from 'crypto-js/enc-hex';
import {
  CreateDigest,
  HashAlgorithms,
  HexString,
  KeyEncodings,
  objectValues
} from 'otplib-core';
import { CreateRandomBytes } from 'otplib-authenticator';

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

export const createDigest: CreateDigest = (
  algorithm: HashAlgorithms,
  hmacKey: HexString,
  counter: HexString
): HexString => {
  const encoder = cryptoEncoder(algorithm);
  const message = Hex.parse(counter);
  const secret = Hex.parse(hmacKey);
  return String(encoder(message, secret));
};

export const createRandomBytes: CreateRandomBytes = (
  size: number,
  encoding: KeyEncodings
): string => {
  const words = WordArray.random(size);
  return Buffer.from(words.toString(), 'hex').toString(encoding);
};
