import base32Decode from 'base32-decode';
import base32Encode from 'base32-encode';
import {
  RFC4648String,
  KeyDecoder,
  KeyEncoder
} from 'packages/otplib-authenticator';
import { KeyEncodings } from 'packages/otplib-core';

export const keyDecoder: KeyDecoder = (
  encodedSecret: RFC4648String,
  encoding: string
): string => {
  const arrayBuffer = base32Decode(encodedSecret.toUpperCase(), 'RFC4648');
  return Buffer.from(arrayBuffer).toString(encoding);
};

export const keyEncoder: KeyEncoder = (
  secret: string,
  encoding: KeyEncodings
): RFC4648String => {
  return base32Encode(Buffer.from(secret, encoding), 'RFC4648', {
    padding: false
  });
};
