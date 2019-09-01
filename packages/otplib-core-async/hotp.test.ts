import { HOTP } from 'otplib-core';
import { testClassPropertiesEqual } from 'tests-suites/helpers';
import { testSuiteHOTP } from 'tests-suites/core-hotp';
import { HOTPAsync } from './hotp';

testClassPropertiesEqual<HOTP, HOTPAsync>(
  HOTP.name,
  new HOTP(),
  HOTPAsync.name,
  new HOTPAsync()
);

testSuiteHOTP<HOTPAsync>('hotp-async', HOTPAsync);
