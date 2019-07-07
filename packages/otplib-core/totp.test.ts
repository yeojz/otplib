import * as hotp from './hotp';
import {
  TOTPOptions,
  totpOptionsValidator,
  TOTP,
  totpCreateHmacKey,
  totpCheckWithWindow
} from './totp';
import { KeyEncodings } from './utils';

interface TOTPCheckTestCase {
  delta: number;
  digest: string;
  digestIndex: number;
  epoch: number;
  token: string;
}

const secret = 'i6im0gc96j0mn00c';
const wrongDigest = '51ca22e6cefa3c035535987fb0b2599ef239111e';
const dataset: TOTPCheckTestCase[] = [
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

const runOptionValidator = (
  opt: Partial<TOTPOptions>
): { error: boolean; message?: string } => {
  try {
    totpOptionsValidator(opt);
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

describe('totpCreateHmacKey', (): void => {
  test('should throw error for unsupported type', (): void => {
    expect((): void => {
      // @ts-ignore
      totpCreateHmacKey('', secret, KeyEncodings.ASCII);
    }).toThrow();
  });
});

describe('totpCheckWithWindow', (): void => {
  test('options.number - non-number / non-array', (): void => {
    expect((): void => {
      // @ts-ignore
      totpCheckWithWindow('123456', secret, { window: null });
    }).toThrow();
  });

  test('options.number - array of non-number will throw', (): void => {
    expect((): void => {
      // @ts-ignore
      totpCheckWithWindow('123456', secret, { window: ['test', 'me'] });
    }).toThrow();
  });
});

describe('totpOptionsValidator', (): void => {
  const hotpOptionsValidator = jest.spyOn(hotp, 'hotpOptionsValidator');

  afterAll((): void => {
    hotpOptionsValidator.mockReset();
  });

  test('missing options.epoch, should throw error', (): void => {
    const result = runOptionValidator({});

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.epoch');
  });

  test('missing options.step, should throw error', (): void => {
    const result = runOptionValidator({
      epoch: Date.now()
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.step');
  });
});

describe('TOTP', (): void => {
  test('no arguments, should init without error', (): void => {
    expect((): TOTP => new TOTP()).not.toThrow();
  });

  test('should init default values which does not reset', (): void => {
    let instance = new TOTP({});
    expect(instance.options).toEqual({});

    instance = new TOTP({ digits: 100 });
    expect(instance.options).toEqual({ digits: 100 });

    instance.resetOptions();
    expect(instance.options).toEqual({ digits: 100 });
  });

  test('should set options which resets', (): void => {
    const instance = new TOTP({});
    instance.options = { digits: 100 };
    expect(instance.options).toEqual({ digits: 100 });

    instance.resetOptions();
    expect(instance.options).toEqual({});
  });

  test('token given is not a number string, should return false', (): void => {
    const instance = new TOTP({ createDigest: (): string => '' });
    const result = instance.check('not-a-number', secret);
    expect(result).toBe(false);
  });

  test('should generate expected token', (): void => {
    const entry = dataset[0];

    const instance = new TOTP({
      createDigest: (): string => entry.digest,
      epoch: entry.epoch
    });

    const result = instance.generate(secret);
    expect(result).toBe(entry.token);
  });

  const checkInstance = new TOTP({
    epoch: dataset[1].epoch,
    window: [1, 2]
  });

  dataset.forEach((entry): void => {
    describe(`check window ${entry.delta}`, (): void => {
      beforeEach((): void => {
        checkInstance.options = {
          createDigest: digestOnIndex(entry.digestIndex, entry.digest)
        };
      });

      test(`check`, (): void => {
        expect(checkInstance.check(entry.token, secret)).toBe(true);
      });

      test(`verify`, (): void => {
        expect(checkInstance.verify({ token: entry.token, secret })).toBe(true);
      });

      test(`checkDelta`, (): void => {
        expect(checkInstance.checkDelta(entry.token, secret)).toBe(entry.delta);
      });
    });
  });

  describe('timeRemaining / timeUsed', (): void => {
    const epoch1 = 1529154660000;
    const epoch2 = 1529154640000;

    const instance = new TOTP({});

    test(`[${epoch1}, 30]`, (): void => {
      instance.options = { epoch: epoch1, step: 30 };

      expect(instance.timeRemaining()).toBe(30);
      expect(instance.timeUsed()).toBe(0);
    });

    test(`[${epoch1}, 18]`, (): void => {
      instance.options = { epoch: epoch1, step: 18 };

      expect(instance.timeRemaining()).toBe(6);
      expect(instance.timeUsed()).toBe(12);
    });

    test(`[${epoch2}, 30]`, (): void => {
      instance.options = { epoch: epoch2, step: 30 };

      expect(instance.timeRemaining()).toBe(20);
      expect(instance.timeUsed()).toBe(10);
    });
  });

  test('should return expected keyuri', (): void => {
    const instance = new TOTP({ createDigest: (): string => '' });
    expect(instance.keyuri('otpuser', 'otplib', 'otpsecret')).toEqual(
      'otpauth://totp/otplib:otpuser?secret=otpsecret&period=30&digits=6&algorithm=SHA1'
    );
  });
});
