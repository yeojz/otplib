import { pkgTestSuite } from 'tests-suites';
import { keyDecoder, keyEncoder } from 'otplib-base32/base32-endec';
import * as pkg from './index';

const createDigest = pkg.hotp.options.createDigest;

pkgTestSuite('otplib-cryptojs', {
  ...pkg,
  authenticator: pkg.authenticator.clone({ keyEncoder, keyDecoder })
});

test('createDigest fails on unsupported encoding format', (): void => {
  const fn = (): void => {
    // @ts-ignore
    createDigest('unknown', 'test', '0');
  };
  expect(fn).toThrow();
});
