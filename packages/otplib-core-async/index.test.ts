import { HOTP, TOTP, Authenticator } from './index';

describe('importing and initialising non-async classes should throw', (): void => {
  test('new HOTP() should throw', (): void => {
    expect((): void => {
      new HOTP();
    }).toThrow();
  });

  test('new TOTP() should throw', (): void => {
    expect((): void => {
      new TOTP();
    }).toThrow();
  });

  test('new Authenticator() should throw', (): void => {
    expect((): void => {
      new Authenticator();
    }).toThrow();
  });
});
