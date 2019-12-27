import { TOTP } from '@otplib/core';
import { testClassPropertiesEqual } from 'tests/utils';
import { testSuiteTOTP } from 'tests/suite/totp';
import { TOTPAsync } from './totp';

testClassPropertiesEqual<TOTP, TOTPAsync>(
  TOTP.name,
  new TOTP(),
  TOTPAsync.name,
  new TOTPAsync()
);

testSuiteTOTP<TOTPAsync>('totp-async', TOTPAsync);
