import { pkgTestSuite } from 'packages/tests-suites';
import * as pkg from './index';

pkgTestSuite('otplib-cryptojs', pkg);

const createDigest = pkg.hotp.options.createDigest;

test('createDigest fails on unsupported encoding format', (): void => {
  const fn = (): void => {
    // @ts-ignore
    createDigest('unknown', 'test', '0');
  };
  expect(fn).toThrow();
});
