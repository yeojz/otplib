import { OTPOptions, OTP, HashAlgorithms } from '@otplib/core';
import { table } from 'tests/data/sample-authenticator';
import { GenericFunction } from 'tests/utils';

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

    table.forEach((entry): void => {
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
