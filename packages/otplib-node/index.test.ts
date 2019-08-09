import { pkgTestSuite } from 'tests-suites';
import { keyDecoder, keyEncoder } from 'otplib-base32/base32-endec';
import * as pkg from './index';

pkgTestSuite('otplib-node', {
  ...pkg,
  authenticator: pkg.authenticator.clone({ keyEncoder, keyDecoder })
});
