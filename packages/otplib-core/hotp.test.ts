import { secret } from 'packages/tests-data/rfc4226';
import { HOTPOptions, hotpOptionsValidator, HOTP } from './hotp';
import { HashAlgorithms } from './utils';

interface HOTPCheckTestCase {
  token: string;
  secret: string;
  counter: number;
  digest: string;
}

const dataset: HOTPCheckTestCase[] = [
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

const runOptionValidator = (
  opt: Partial<HOTPOptions>
): { error: boolean; message?: string } => {
  try {
    hotpOptionsValidator(opt);
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

describe('hotpOptionsValidator', (): void => {
  const createDigest = jest.fn();
  const createHmacKey = jest.fn();

  test(`missing options.createDigest, should throw error`, (): void => {
    const result = runOptionValidator({});

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.createDigest');
  });

  test(`missing options.createHmacKey, should throw error`, (): void => {
    const result = runOptionValidator({ createDigest });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.createHmacKey');
  });

  test(`missing options.digits, should throw error`, (): void => {
    const result = runOptionValidator({ createDigest, createHmacKey });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.digits');
  });
  test(`missing options.algorithm, should throw error`, (): void => {
    const result = runOptionValidator({
      createDigest,
      createHmacKey,
      digits: 6
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.algorithm');
  });

  test(`missing options.encoding, should throw error`, (): void => {
    const result = runOptionValidator({
      createDigest,
      createHmacKey,
      digits: 6,
      algorithm: HashAlgorithms.SHA1
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('options.encoding');
  });
});

describe('HOTP', (): void => {
  test('no arguments, should init without error', (): void => {
    expect((): HOTP => new HOTP()).not.toThrow();
  });

  test('should init default values which does not reset', (): void => {
    let instance = new HOTP({});
    expect(instance.options).toEqual({});

    instance = new HOTP({ digits: 100 });
    expect(instance.options).toEqual({ digits: 100 });

    instance.resetOptions();
    expect(instance.options).toEqual({ digits: 100 });
  });

  test('should set options which resets', (): void => {
    const instance = new HOTP({});
    instance.options = { digits: 100 };
    expect(instance.options).toEqual({ digits: 100 });

    instance.resetOptions();
    expect(instance.options).toEqual({});
  });

  test('token given is not a number string, should return false', (): void => {
    const instance = new HOTP({ createDigest: (): string => '' });
    const result = instance.check('not-a-number', secret, 0);
    expect(result).toBe(false);
  });

  dataset.forEach((entry): void => {
    describe(`dataset: [${entry.token}, ${entry.counter}]`, (): void => {
      const instance = new HOTP({});

      beforeAll((): void => {
        instance.options = {
          createDigest: (): string => entry.digest
        };
      });

      test('generate should return expected token', (): void => {
        const result = instance.generate(entry.secret, entry.counter);
        expect(result).toEqual(entry.token);
      });

      test(`check should return true `, (): void => {
        const result = instance.check(entry.token, entry.secret, entry.counter);
        expect(result).toBe(true);
      });

      test(`verify should return true `, (): void => {
        const result = instance.verify(entry);
        expect(result).toBe(true);
      });
    });
  });

  test('should return expected keyuri', (): void => {
    const instance = new HOTP({ createDigest: (): string => '' });
    expect(
      instance.keyuri('otpuser', 'otplib', 'otpsecret', { counter: 0 })
    ).toEqual(
      'otpauth://hotp/otplib:otpuser?secret=otpsecret&counter=0&digits=6&algorithm=SHA1'
    );
  });
});
