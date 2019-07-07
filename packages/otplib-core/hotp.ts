import {
  HASH_ALGORITHMS,
  HashAlgorithms,
  HexString,
  KEY_ENCODINGS,
  KeyEncodings,
  Strategy,
  isTokenValid,
  keyuri,
  KeyURIOptions
} from './utils';

export interface CreateDigest {
  (
    algorithm: HashAlgorithms,
    hmacKey: HexString,
    counter: HexString
  ): HexString;
}

export interface CreateHmacKey {
  (
    algorithm: HashAlgorithms,
    secret: string,
    encoding: KeyEncodings
  ): HexString;
}

export interface HOTPOptions {
  algorithm: HashAlgorithms;
  createDigest: CreateDigest;
  createHmacKey: CreateHmacKey;
  digits: number;
  encoding: KeyEncodings;
}

export function hotpOptionsValidator(options: Partial<HOTPOptions>): void {
  if (typeof options.createDigest !== 'function') {
    throw new Error('Expecting options.createDigest to be a function.');
  }

  if (typeof options.createHmacKey !== 'function') {
    throw new Error('Expecting options.createHmacKey to be a function.');
  }

  if (typeof options.digits !== 'number') {
    throw new Error('Expecting options.digits to be a number.');
  }

  if (!options.algorithm || HASH_ALGORITHMS.indexOf(options.algorithm) < 0) {
    throw new Error(
      `Expecting options.algorithm to be one of ${HASH_ALGORITHMS.join(
        ', '
      )}. Received ${options.algorithm}.`
    );
  }

  if (!options.encoding || KEY_ENCODINGS.indexOf(options.encoding) < 0) {
    throw new Error(
      `Expecting options.encoding to be one of ${KEY_ENCODINGS.join(
        ', '
      )}. Received ${options.encoding}.`
    );
  }
}

export function hotpCounter(counter: number): string {
  const hexCounter = counter.toString(16);
  return hexCounter.padStart(16, '0');
}

export function hotpToken(
  secret: string,
  counter: number,
  options: HOTPOptions
): string {
  const hexCounter = hotpCounter(counter);
  const hmacKey = options.createHmacKey(
    options.algorithm,
    secret,
    options.encoding
  );

  const digest = Buffer.from(
    options.createDigest(options.algorithm, hmacKey, hexCounter),
    'hex'
  );

  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const token = binary % Math.pow(10, options.digits);
  return String(token).padStart(options.digits, '0');
}

export function hotpCheck(
  token: string,
  secret: string,
  counter: number,
  options: HOTPOptions
): boolean {
  if (!isTokenValid(token)) {
    return false;
  }

  const systemToken = hotpToken(secret, counter, options);
  return token === systemToken;
}

export const hotpCreateHmacKey: CreateHmacKey = (
  algorithm: HashAlgorithms,
  secret: string,
  encoding: KeyEncodings
): HexString => {
  return Buffer.from(secret, encoding).toString('hex');
};

export function hotpOptions(opt: Partial<HOTPOptions>): HOTPOptions {
  const options: Partial<HOTPOptions> = {
    algorithm: HashAlgorithms.SHA1,
    createHmacKey: hotpCreateHmacKey,
    digits: 6,
    encoding: KeyEncodings.ASCII,
    ...opt
  };

  hotpOptionsValidator(options);

  return options as HOTPOptions;
}

export class HOTP<T extends HOTPOptions = HOTPOptions> {
  private _defaultOptions: Partial<T>;
  private _options: Partial<T>;

  public constructor(defaultOptions: Partial<T> = {}) {
    this._defaultOptions = { ...defaultOptions };
    this._options = {};
  }

  public get options(): Partial<T> {
    return {
      ...this._defaultOptions,
      ...this._options
    };
  }

  public set options(opt: Partial<T>) {
    this._options = {
      ...this._options,
      ...opt
    };
  }

  public finalOptions(): T {
    return hotpOptions(this.options) as T;
  }

  public resetOptions(): void {
    this._options = {};
  }

  public generate(secret: string, counter: number): string {
    return hotpToken(secret, counter, this.finalOptions());
  }

  public check(token: string, secret: string, counter: number): boolean {
    return hotpCheck(token, secret, counter, this.finalOptions());
  }

  public verify(opts: {
    token: string;
    secret: string;
    counter: number;
  }): boolean {
    return this.check(opts.token, opts.secret, opts.counter);
  }

  public keyuri(
    user: string,
    label: string,
    secret: string,
    params?: Pick<KeyURIOptions, 'counter' | 'issuer'>
  ): string {
    const options = this.finalOptions();

    return keyuri({
      ...params,
      algorithm: options.algorithm,
      digits: options.digits,
      type: Strategy.HOTP,
      label,
      secret,
      user
    });
  }
}
