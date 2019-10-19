import { TOTP } from '@otplib/core';
import { testClassPropertiesEqual } from 'tests-suites/helpers';
import { testSuiteTOTP } from 'tests-suites/core-totp';
import { TOTPAsync } from './totp';

testClassPropertiesEqual<TOTP, TOTPAsync>(
  TOTP.name,
  new TOTP(),
  TOTPAsync.name,
  new TOTPAsync()
);

testSuiteTOTP<TOTPAsync>('totp-async', TOTPAsync);
