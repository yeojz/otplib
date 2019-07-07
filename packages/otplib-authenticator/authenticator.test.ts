import * as totp from 'packages/otplib-core/totp';
import {
  AuthenticatorOptions,
  authenticatorOptionValidator,
  Authenticator
} from './authenticator';

interface AuthenticatorCheckTestCase {
  decoded: string;
  digest: string;
  secret: string;
  epoch: number;
  token: string;
}

const dataset: AuthenticatorCheckTestCase[] = [
  {
    decoded: '68442f372b67474e2f47617679706f6e30756f51',
    digest: '422eb1a849cf0650fef4dbdd8b0ee0fe57a87eb9',
    epoch: 1565103854545,
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    token: '566155'
  },
  {
    decoded: '68442f372b67474e2f47617679706f6e30756f51',
    digest: 'c305b82dbf2a8d2d8a22e9d3992e4e666222d0e2',
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    epoch: 1565103878581,
    token: '522154'
  },
  {
    decoded: '636c6c4e506479436f314f6b4852623167564f76',
    digest: '64a959e511420af1a406424f87b4412977b3cbd4',
    secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
    epoch: 1565103903110,
    token: '540849'
  }
];

const runOptionValidator = (
  opt: Partial<AuthenticatorOptions>
): { error: boolean; message?: string } => {
  try {
    authenticatorOptionValidator(opt);
    return {
      error: false
    };
  } catch (err) {
    return {
      message: err.message,
      error: true
    };
  }
};

describe('authenticatorOptionsValidator', (): void => {
  const totpOptionsValidator = jest.spyOn(totp, 'totpOptionsValidator');

  afterAll((): void => {
    totpOptionsValidator.mockReset();
  });

  test('missing options.keyDecoder, should throw error', (): void => {
    const result = runOptionValidator({});

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.keyDecoder');
  });

  test('non-function options.keyEncoder, should throw error', (): void => {
    const result = runOptionValidator({
      keyDecoder: (): string => '',
      // @ts-ignore
      keyEncoder: 'not-a-function'
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.keyEncoder');
  });
});

describe('Authenticator', (): void => {
  let common: Partial<AuthenticatorOptions> = {};

  beforeEach((): void => {
    common = {
      createDigest: (): string => '',
      createHmacKey: (): string => '',
      keyEncoder: jest.fn((): string => ''),
      keyDecoder: jest.fn((): string => ''),
      createRandomBytes: jest.fn()
    };
  });

  test('given keyEncoder should be called', (): void => {
    const instance = new Authenticator(common);
    instance.encode('');

    expect(common.keyEncoder).toHaveBeenCalledTimes(1);
  });

  test('given keyDecoder should be called', (): void => {
    const instance = new Authenticator(common);
    instance.decode('');

    expect(common.keyDecoder).toHaveBeenCalledTimes(1);
  });

  test('given keyDecoder should be called', (): void => {
    const instance = new Authenticator(common);
    instance.generateSecret();

    expect(common.createRandomBytes).toHaveBeenCalledTimes(1);
    expect(common.keyEncoder).toHaveBeenCalledTimes(1);
  });

  dataset.forEach((entry): void => {
    const instance = new Authenticator({
      createDigest: (): string => entry.digest,
      epoch: entry.epoch,
      keyDecoder: (): string => entry.decoded
    });

    test(`[${entry.epoch}] check`, (): void => {
      expect(instance.check(entry.token, entry.secret)).toBe(true);
    });
  });
});
