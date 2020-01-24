import { authenticatorGenerateSecret, KeyEncodings } from '@otplib/core';
import { createRandomBytes } from '@otplib/plugin-crypto';
import * as thirtyTwo from '@otplib/plugin-thirty-two';
import * as base32EncDec from '@otplib/plugin-base32-enc-dec';

[
  {
    name: 'thirty-two',
    mod: thirtyTwo
  },
  {
    name: 'base32-enc-dec',
    mod: base32EncDec
  }
].forEach(({ name, mod }) => {
  const options = {
    createRandomBytes,
    encoding: KeyEncodings.HEX,
    keyEncoder: mod.keyEncoder,
    keyDecoder: mod.keyDecoder
  };

  test(`[${name}] generated secret should have consistent length`, async () => {
    for (let i = 0; i < 20; i++) {
      expect(authenticatorGenerateSecret(10, options)).toHaveLength(16);
    }
  });
});
