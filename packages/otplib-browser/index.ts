/* globals buffer */
import {
  hotp as hotpBase,
  totp as totpBase,
  authenticator as authenticatorBase
} from 'otplib-cryptojs';
import { keyDecoder, keyEncoder } from 'otplib-base32/base32-endec';

// @ts-ignore
if (typeof window === 'object' && typeof window.Buffer === 'undefined') {
  // @ts-ignore
  window.Buffer = buffer.Buffer;
}

export const hotp = hotpBase;
export const totp = totpBase;
export const authenticator = authenticatorBase.clone({
  keyEncoder,
  keyDecoder
});
