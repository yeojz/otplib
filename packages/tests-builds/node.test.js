import { AUTHENTICATOR_DATASET } from 'tests-suites';
import { authenticator } from '../../builds/otplib/node';
import * as endec from '../../builds/otplib/base32/base32-endec';
import * as thirtyTwo from '../../builds/otplib/base32/thirty-two';

describe('builds - node', () => {
  AUTHENTICATOR_DATASET.forEach(entry => {
    test(`(thirtyTwo) should return expected token - ${entry.token}`, () => {
      const instance = authenticator.clone(thirtyTwo);
      instance.options = { epoch: entry.epoch };
      expect(instance.generate(entry.secret)).toBe(entry.token);
    });
  });

  AUTHENTICATOR_DATASET.forEach(entry => {
    test(`(base32-endec) should return expected token - ${entry.token}`, () => {
      const instance = authenticator.clone(endec);
      instance.options = { epoch: entry.epoch };
      expect(instance.generate(entry.secret)).toBe(entry.token);
    });
  });
});
