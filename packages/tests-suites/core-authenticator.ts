import { OTPOptions, OTP, HashAlgorithms } from 'otplib-core';
import { GenericFunction } from './helpers';

export const dataset: {
  decoded: string;
  digest: string;
  secret: string;
  epoch: number;
  token: string;
}[] = [
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

export function testSuiteAuthenticator<T extends OTP<OTPOptions>>(
  name: string,
  Cls: {
    new (defaultOptions?: Partial<OTPOptions>): T;
  }
): void {
  const Authenticator = (Cls as unknown) as {
    new (defaultOptions?: Partial<OTPOptions>): T & {
      check: GenericFunction;
      decode: GenericFunction;
      encode: GenericFunction;
      generateSecret: GenericFunction;
    };
  };

  describe(`(${name}) Authenticator`, (): void => {
    const mocks = {
      keyEncoder: jest.fn((): string => ''),
      keyDecoder: jest.fn((): string => ''),
      createRandomBytes: jest.fn((): string => '')
    };

    dataset.forEach((entry): void => {
      const instance = new Authenticator({
        createDigest: (): string => entry.digest,
        epoch: entry.epoch,
        keyDecoder: (): string => entry.decoded
      });

      test(`[${entry.epoch}] check`, async (): Promise<void> => {
        const result = await instance.check(entry.token, entry.secret);
        expect(result).toBe(true);
      });
    });

    test('given keyEncoder should be called when encoding', async (): Promise<
      void
    > => {
      mocks.keyEncoder.mockReset();
      const instance = new Authenticator(mocks);

      try {
        await instance.encode('');
      } catch (err) {
        // do nothing.
      }

      expect(mocks.keyEncoder).toHaveBeenCalledTimes(1);
    });

    test('given keyDecoder should be called when decoding', async (): Promise<
      void
    > => {
      mocks.keyDecoder.mockReset();
      const instance = new Authenticator(mocks);

      try {
        await instance.decode('');
      } catch (err) {
        // do nothing.
      }

      expect(mocks.keyDecoder).toHaveBeenCalledTimes(1);
    });

    test('given keyEncoder should be called during secret generation', async (): Promise<
      void
    > => {
      mocks.keyEncoder.mockReset();
      const instance = new Authenticator(mocks);

      try {
        await instance.generateSecret();
      } catch (err) {
        // do nothing.
      }

      expect(mocks.keyEncoder).toHaveBeenCalledTimes(1);
    });

    test('calling create returns a new instance with new set of defaults', (): void => {
      const opt = {
        algorithm: HashAlgorithms.SHA256
      };

      const instance = new Authenticator(opt);
      expect(instance.options).toEqual(opt);

      const instance2 = instance.create();
      expect(instance2).toBeInstanceOf(Authenticator);
      expect(instance2.options).toEqual({});
    });
  });
}
