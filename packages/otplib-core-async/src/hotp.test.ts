import { HOTP } from '@otplib/core';
import { testClassPropertiesEqual } from '@tests/utils';
import { testSuiteHOTP } from '@tests/suite/hotp';
import { HOTPAsync } from './hotp';

testClassPropertiesEqual<HOTP, HOTPAsync>(
  HOTP.name,
  new HOTP(),
  HOTPAsync.name,
  new HOTPAsync()
);

testSuiteHOTP<HOTPAsync>('hotp-async', HOTPAsync);
