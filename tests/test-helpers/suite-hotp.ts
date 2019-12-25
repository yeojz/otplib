/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { secret } from './data-rfc4226';
import { OTP, HashAlgorithms, OTPOptions } from 'otplib-core';
import { GenericFunction } from './utils';

const dataset: {
  token: string;
  secret: string;
  counter: number;
  digest: string;
}[] = [
  {
    token: '229021',
    secret: 'i6im0gc96j0mn00c',
    counter: 3,
    digest: '9b8d3061fec12538d6434e0ca65b9d6a3cbe635b'
  },
  {
    token: '196182',
    secret: 'i6im0gc96j0mn00c',
    counter: 47412420,
    digest: '76bd931db2bb39e6a7d3dd56f1403bc591163c68'
  },
  {
    token: '963234',
    secret: '65jh84eo38k32edm',
    counter: 47412423,
    digest: 'c06cacb24aa06609119a57d2e20dd46b0316d7d9'
  },
  {
    token: '415572',
    secret: 'f4515l6ob3gkganp',
    counter: 47412433,
    digest: '75850e08281453037f6f6033748eb66ac25357b2'
  },
  {
    token: '343659',
    secret: '2o9989k76ij7eh9c',
    counter: 47412435,
    digest: '476026da7f9f921c8bdc784d7aeb2b64b85cdd1a'
  }
];

export function testSuiteHOTP<T extends OTP<OTPOptions>>(
  name: string,
  Cls: {
    new (defaultOptions?: Partial<OTPOptions>): T;
  }
): void {
  const HOTP = (Cls as unknown) as {
    new (defaultOptions?: Partial<OTPOptions>): T & {
      check: GenericFunction;
      generate: GenericFunction;
      keyuri: GenericFunction;
      verify: GenericFunction;
    };
  };

  describe(`(${name}) HOTP`, (): void => {
    dataset.forEach((entry): void => {
      describe(`dataset: [${entry.token}, ${entry.counter}]`, (): void => {
        const instance = new HOTP({});

        beforeAll((): void => {
          instance.options = {
            createDigest: (): string => entry.digest
          };
        });

        test('generate should return expected token', async (): Promise<
          void
        > => {
          const result = await instance.generate(entry.secret, entry.counter);
          expect(result).toEqual(entry.token);
        });

        test(`check should return true `, async (): Promise<void> => {
          const result = await instance.check(
            entry.token,
            entry.secret,
            entry.counter
          );
          expect(result).toBe(true);
        });

        test(`verify should return true `, async (): Promise<void> => {
          const result = await instance.verify(entry);
          expect(result).toBe(true);
        });
      });
    });

    test('calling generate without providing a createDigest implementation throws', async (): Promise<
      void
    > => {
      expect.assertions(1);
      const instance = new HOTP();

      try {
        // @ts-ignore
        await instance.generate(secret, 0);
      } catch (err) {
        expect(err.message).toContain('options.createDigest');
      }
    });

    test('token given is not a number string, should return false', async (): Promise<
      void
    > => {
      const instance = new HOTP({ createDigest: (): string => '' });
      const result = await instance.check('not-a-number', secret, 0);
      expect(result).toBe(false);
    });

    test('verify method should error when argument given is not an object', async (): Promise<
      void
    > => {
      expect.assertions(3);
      const instance = new HOTP({});

      try {
        await instance.verify(null);
      } catch (err) {
        expect(err).not.toBeUndefined();
      }

      try {
        await instance.verify();
      } catch (err) {
        expect(err).not.toBeUndefined();
      }

      try {
        await instance.verify(true);
      } catch (err) {
        expect(err).not.toBeUndefined();
      }
    });

    test('should return expected keyuri', async (): Promise<void> => {
      const instance = new HOTP({ createDigest: (): string => '' });
      const result = await instance.keyuri('otpuser', 'otplib', 'otpsecret', 0);
      expect(result).toEqual(
        'otpauth://hotp/otplib:otpuser?secret=otpsecret&counter=0&digits=6&algorithm=SHA1&issuer=otplib'
      );
    });

    test('calling create returns a new instance with new set of defaults', (): void => {
      const opt = {
        algorithm: HashAlgorithms.SHA256
      };

      const instance = new HOTP(opt);
      expect(instance.options).toEqual(opt);

      const instance2 = instance.create();
      expect(instance2).toBeInstanceOf(HOTP);
      expect(instance2.options).toEqual({});
    });
  });
}
