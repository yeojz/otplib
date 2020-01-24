import { authenticatorGenerateSecret, KeyEncodings } from '@otplib/core';
import { createRandomBytes } from '@otplib/plugin-crypto';
import * as thirtyTwo from '@otplib/plugin-thirty-two';
import * as base32EncDec from '@otplib/plugin-base32-enc-dec';

function runTestIssue201(name, base32) {
  const options = {
    createRandomBytes,
    encoding: KeyEncodings.HEX,
    keyEncoder: base32.keyEncoder,
    keyDecoder: base32.keyDecoder
  };

  test(`#201 - [${name}] generated secret should have consistent length`, async () => {
    for (let i = 0; i < 20; i++) {
      expect(authenticatorGenerateSecret(10, options)).toHaveLength(16);
    }
  });
}

runTestIssue201('thirty-two', thirtyTwo);
runTestIssue201('base32-enc-dec', base32EncDec);
