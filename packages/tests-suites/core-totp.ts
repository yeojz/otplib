import { OTPOptions, OTP, HashAlgorithms } from 'otplib-hotp';
import { GenericFunction } from './helpers';

const secret = 'i6im0gc96j0mn00c';
const wrongDigest = '51ca22e6cefa3c035535987fb0b2599ef239111e';
const dataset: {
  delta: number;
  digest: string;
  digestIndex: number;
  epoch: number;
  token: string;
}[] = [
  {
    delta: -1,
    digest: '7fb0b2599ef239111e51ca22e6cefa3c03553598',
    digestIndex: 1,
    epoch: 1565017294387,
    token: '676642'
  },
  {
    delta: 0,
    digest: '0d8101dd177590411484e19e66be43d84fd71085',
    digestIndex: 0,
    epoch: 1565017329607,
    token: '388116'
  },
  {
    delta: 1,
    digest: '8f822b26873985c9f0268eca7811dc92210780f6',
    digestIndex: 2,
    epoch: 1565017364743,
    token: '120294'
  },
  {
    delta: 2,
    digest: '46bc50a61afa32cbcc28bc5b7149050e40421e54',
    digestIndex: 3,
    epoch: 1565017387837,
    token: '604619'
  }
];

const digestOnIndex = (num: number, digest: string): (() => string) => {
  let idx = -1;
  return (): string => {
    idx = idx + 1;
    return idx === num ? digest : wrongDigest;
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
    dataset.forEach((entry): void => {
      describe(`check window ${entry.delta}`, (): void => {
        const instance = new TOTP({
          epoch: dataset[1].epoch,
          window: [1, 2]
        });

        beforeEach((): void => {
          instance.options = {
            createDigest: digestOnIndex(entry.digestIndex, entry.digest)
          };
        });

        test(`check`, async (): Promise<void> => {
          const result = await instance.check(entry.token, secret);
          expect(result).toBe(true);
        });

        test(`verify`, async (): Promise<void> => {
          const result = await instance.verify({
            token: entry.token,
            secret
          });
          expect(result).toBe(true);
        });

        test(`checkDelta`, async (): Promise<void> => {
          const result = await instance.checkDelta(entry.token, secret);
          expect(result).toBe(entry.delta);
        });
      });
    });

    test('token given is not a number string, should return false', async (): Promise<
      void
    > => {
      const instance = new TOTP({ createDigest: (): string => '' });
      const result = await instance.check('not-a-number', secret);
      expect(result).toBe(false);
    });

    test('should generate expected token', async (): Promise<void> => {
      const entry = dataset[0];

      const instance = new TOTP({
        createDigest: (): string => entry.digest,
        epoch: entry.epoch
      });

      const result = await instance.generate(secret);
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
