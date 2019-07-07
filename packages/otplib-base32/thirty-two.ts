// @ts-ignore
import thirtyTwo from 'thirty-two';
import {
  RFC4648String,
  KeyDecoder,
  KeyEncoder
} from 'packages/otplib-authenticator';
import { KeyEncodings } from 'packages/otplib-core';

export const keyDecoder: KeyDecoder = (
  encodedSecret: RFC4648String,
  encoding: KeyEncodings
): string => {
  return thirtyTwo.decode(encodedSecret).toString(encoding);
};

export const keyEncoder: KeyEncoder = (
  secret: string,
  encoding: KeyEncodings
): RFC4648String => {
  return thirtyTwo
    .encode(Buffer.from(secret, encoding).toString())
    .toString()
    .replace(/=/g, '');
};
