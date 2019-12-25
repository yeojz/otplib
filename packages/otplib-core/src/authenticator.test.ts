/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { testSuiteAuthenticator } from '../test/core-authenticator';
import { runOptionValidator } from '../test/utils';
import * as totp from './totp';
import {
  AuthenticatorOptions,
  authenticatorOptionValidator,
  Authenticator
} from './authenticator';

testSuiteAuthenticator<Authenticator>('authenticator', Authenticator);

describe('authenticatorOptionsValidator', (): void => {
  const totpOptionsValidator = jest.spyOn(totp, 'totpOptionsValidator');

  afterAll((): void => {
    totpOptionsValidator.mockReset();
  });

  test('missing options.keyDecoder, should throw error', (): void => {
    const result = runOptionValidator<AuthenticatorOptions>(
      authenticatorOptionValidator,
      {}
    );

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.keyDecoder');
  });

  test('non-function options.keyEncoder, should throw error', (): void => {
    const result = runOptionValidator<AuthenticatorOptions>(
      authenticatorOptionValidator,
      {
        keyDecoder: (): string => '',
        // @ts-ignore
        keyEncoder: 'not-a-function'
      }
    );

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.keyEncoder');
  });
});
