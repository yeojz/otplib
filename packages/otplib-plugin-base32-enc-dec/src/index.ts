import base32Decode from 'base32-decode';
import base32Encode from 'base32-encode';
import {
  Base32SecretKey,
  KeyDecoder,
  KeyEncoder,
  KeyEncodings,
  SecretKey
} from '@otplib/core';

/**
 * - Key decoder using npm `base32-decode`
 */
export const keyDecoder: KeyDecoder = (
  secret: Base32SecretKey,
  encoding: KeyEncodings
): SecretKey => {
  const arrayBuffer = base32Decode(secret.toUpperCase(), 'RFC4648');
  return Buffer.from(arrayBuffer).toString(encoding);
};

/**
 * - Key encoder using npm `base32-encode`
 */
export const keyEncoder: KeyEncoder = (
  secret: SecretKey,
  encoding: KeyEncodings
): Base32SecretKey => {
  return base32Encode(Buffer.from(secret, encoding), 'RFC4648', {
    padding: false
  });
};
