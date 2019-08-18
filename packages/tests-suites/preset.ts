import { Authenticator, TOTP, HOTP } from 'otplib-core';
import { HOTPAsync, TOTPAsync, AuthenticatorAsync } from 'otplib-core-async';
import {
  rfcTestSuiteHOTP,
  rfcTestSuiteTOTP,
  dataTestSuiteAuthenticator
} from './dataset';
import { testSuiteIssues } from './issues';

interface Presets {
  hotp: HOTP | HOTPAsync;
  totp: TOTP | TOTPAsync;
  authenticator: Authenticator | AuthenticatorAsync;
}

export function testSuitePreset(name: string, pkg: Presets): void {
  rfcTestSuiteHOTP(name, pkg.hotp);
  rfcTestSuiteTOTP(name, pkg.totp);
  dataTestSuiteAuthenticator(name, pkg.authenticator);
  testSuiteIssues(name, pkg.authenticator);
}
