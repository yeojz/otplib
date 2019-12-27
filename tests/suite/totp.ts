import { OTPOptions, OTP, HashAlgorithms } from '@otplib/core';
import { table } from 'tests/data/sample-totp';
import { GenericFunction } from 'tests/utils';

const WRONG_DIGEST = '51ca22e6cefa3c035535987fb0b2599ef239111e';

const digestOnIndex = (num: number, digest: string): (() => string) => {
  let idx = -1;
  return (): string => {
    idx = idx + 1;
    return idx === num ? digest : WRONG_DIGEST;
  };
};

export function testSuiteTOTP<T extends OTP<OTPOptions>>(
  name: string,
  Cls: {
    new (defaultOptions?: Partial<OTPOptions>): T;
  }
): void {
  const TOTP = (Cls as unknown) as {
    new (defaultOptions?: Partial<OTPOptions>): T & {
      check: GenericFunction;
      checkDelta: GenericFunction;
      generate: GenericFunction;
      keyuri: GenericFunction;
      timeRemaining: GenericFunction;
      timeUsed: GenericFunction;
      verify: GenericFunction;
    };
  };

  describe(`(${name}) TOTP`, (): void => {
    table.forEach((entry): void => {
      describe(`check window ${entry.delta}`, (): void => {
        const instance = new TOTP({
          epoch: table[1].epoch,
          window: [1, 2]
        });

        beforeEach((): void => {
          instance.options = {
            createDigest: digestOnIndex(entry.digestIndex, entry.digest)
          };
        });

        test(`check`, async (): Promise<void> => {
          const result = await instance.check(entry.token, entry.secret);
          expect(result).toBe(true);
        });

        test(`verify`, async (): Promise<void> => {
          const result = await instance.verify({
            token: entry.token,
            secret: entry.secret
          });
          expect(result).toBe(true);
        });

        test(`checkDelta`, async (): Promise<void> => {
          const result = await instance.checkDelta(entry.token, entry.secret);
          expect(result).toBe(entry.delta);
        });
      });
    });

    test('token given is not a number string, should return false', async (): Promise<
      void
    > => {
      const instance = new TOTP({ createDigest: (): string => '' });
      const result = await instance.check('not-a-number', table[0].secret);
      expect(result).toBe(false);
    });

    test('should generate expected token', async (): Promise<void> => {
      const entry = table[0];

      const instance = new TOTP({
        createDigest: (): string => entry.digest,
        epoch: entry.epoch
      });

      const result = await instance.generate(entry.secret);
      expect(result).toBe(entry.token);
    });

    test('verify method should error when argument given is not an object', async (): Promise<
      void
    > => {
      expect.assertions(3);
      const instance = new TOTP({});

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

    describe('timeRemaining / timeUsed', (): void => {
      const epoch1 = 1529154660000;
      const epoch2 = 1529154640000;

      const instance = new TOTP({});

      test(`[${epoch1}, 30]`, async (): Promise<void> => {
        instance.options = { epoch: epoch1, step: 30 };

        const remaining = await instance.timeRemaining();
        const used = await instance.timeUsed();

        expect(remaining).toBe(30);
        expect(used).toBe(0);
      });

      test(`[${epoch1}, 18]`, async (): Promise<void> => {
        instance.options = { epoch: epoch1, step: 18 };

        const remaining = await instance.timeRemaining();
        const used = await instance.timeUsed();

        expect(remaining).toBe(6);
        expect(used).toBe(12);
      });

      test(`[${epoch2}, 30]`, async (): Promise<void> => {
        instance.options = { epoch: epoch2, step: 30 };

        const remaining = await instance.timeRemaining();
        const used = await instance.timeUsed();

        expect(remaining).toBe(20);
        expect(used).toBe(10);
      });
    });

    test('should return expected keyuri', async (): Promise<void> => {
      const instance = new TOTP({ createDigest: (): string => '' });
      const result = await instance.keyuri('otpuser', 'otplib', 'otpsecret');
      expect(result).toEqual(
        'otpauth://totp/otplib:otpuser?secret=otpsecret&period=30&digits=6&algorithm=SHA1&issuer=otplib'
      );
    });

    test('calling create returns a new instance with new set of defaults', (): void => {
      const opt = {
        algorithm: HashAlgorithms.SHA256
      };

      const instance = new TOTP(opt);
      expect(instance.options).toEqual(opt);

      const instance2 = instance.create();
      expect(instance2).toBeInstanceOf(TOTP);
      expect(instance2.options).toEqual({});
    });
  });
}
