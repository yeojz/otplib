import { AUTHENTICATOR_DATASET } from 'tests-suites';
import * as otplibImport from '../../builds/otplib/browser';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const otplibRequire = require('../../builds/otplib/browser');

describe('builds - browser (require)', () => {
  AUTHENTICATOR_DATASET.forEach(entry => {
    test(`should return expected token - ${entry.token}`, () => {
      const instance = otplibRequire.authenticator.clone();
      instance.options = { epoch: entry.epoch };
      expect(instance.generate(entry.secret)).toBe(entry.token);
    });
  });
});

describe('builds - browser (import)', () => {
  AUTHENTICATOR_DATASET.forEach(entry => {
    test(`should return expected token - ${entry.token}`, () => {
      const instance = otplibImport.authenticator.clone();
      instance.options = { epoch: entry.epoch };
      expect(instance.generate(entry.secret)).toBe(entry.token);
    });
  });
});
