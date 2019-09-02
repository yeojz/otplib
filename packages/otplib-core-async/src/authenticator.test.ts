import { Authenticator } from 'otplib-core';
import { testSuiteAuthenticator } from 'tests-suites/core-authenticator';
import { testClassPropertiesEqual } from 'tests-suites/helpers';
import { AuthenticatorAsync } from './authenticator';

testClassPropertiesEqual<Authenticator, AuthenticatorAsync>(
  Authenticator.name,
  new Authenticator(),
  AuthenticatorAsync.name,
  new AuthenticatorAsync()
);

testSuiteAuthenticator<AuthenticatorAsync>(
  'authenticator-async',
  AuthenticatorAsync
);
