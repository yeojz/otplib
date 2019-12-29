import { Authenticator } from '@otplib/core';
import { testSuiteAuthenticator } from '@tests/suite/authenticator';
import { testClassPropertiesEqual } from '@tests/utils';
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
