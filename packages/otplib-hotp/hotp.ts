import {
  HashAlgorithms,
  HexString,
  KeyEncodings,
  SecretKey,
  Strategy,
  isTokenValid,
  keyuri,
  objectValues,
  padStart
} from './utils';

const HASH_ALGORITHMS = objectValues<typeof HashAlgorithms>(HashAlgorithms);
const KEY_ENCODINGS = objectValues<typeof KeyEncodings>(KeyEncodings);

/**
 * Interface method for generating a HMAC digest
 * which is then used to generate the token.
 */
export interface CreateDigest {
  (
    algorithm: HashAlgorithms,
    hmacKey: HexString,
    counter: HexString
  ): HexString;
}

/**
 * Interface method for formatting the [[SecretKey]] with
 * the algorithm constraints before it is given to [[CreateDigest]].
 */
export interface CreateHmacKey {
  (
    algorithm: HashAlgorithms,
    secret: SecretKey,
    encoding: KeyEncodings
  ): HexString;
}

/**
 * Interface for options used in HOTP.
 */
export interface HOTPOptions {
  /** The algorithm used for calculating the HMAC. */
  algorithm: HashAlgorithms;
  /** Creates the digest which token is derived from. */
  createDigest: CreateDigest;
  /** The method used to create a HMAC key (when calculating HMAC). */
  createHmacKey: CreateHmacKey;
  /** The number of digits a token will have. Usually 6 or 8. */
  digits: number;
  /** The encoding that was used on the secret. */
  encoding: KeyEncodings;
}

/**
 * Validates the given [[HOTPOptions]]
 */
export function hotpOptionsValidator(
  options: Readonly<Partial<HOTPOptions>>
): void {
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

/**
 * Formats a given counter into a string counter.
 */
export function hotpCounter(counter: number): HexString {
  const hexCounter = counter.toString(16);
  return padStart(hexCounter, 16, '0');
}

/**
 * Generates a HMAC-based One-time Token (HOTP)
 *
 * **References**
 *
 * -   http://en.wikipedia.org/wiki/HMAC-based_One-time_Password_Algorithm
 * -   http://tools.ietf.org/html/rfc4226
 *
 */
export function hotpToken(
  secret: SecretKey,
  counter: number,
  options: Readonly<HOTPOptions>
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
  return padStart(String(token), options.digits, '0');
}

/**
 * Checks the given token against the system generated token.
 *
 * **Note**: Token is valid only if it is a number string
 */
export function hotpCheck(
  token: string,
  secret: SecretKey,
  counter: number,
  options: Readonly<HOTPOptions>
): boolean {
  if (!isTokenValid(token)) {
    return false;
  }

  const systemToken = hotpToken(secret, counter, options);
  return token === systemToken;
}

/**
 * Takes a HOTP secret and derives the HMAC key
 * for use in token generation.
 *
 * @param algorithm - Reference: [[HOTPOptions.algorithm]]
 * @param secret
 * @param encoding - Reference: [[HOTPOptions.encoding]]
 */
export const hotpCreateHmacKey: CreateHmacKey = (
  algorithm: HashAlgorithms,
  secret: SecretKey,
  encoding: KeyEncodings
): HexString => {
  return Buffer.from(secret, encoding).toString('hex');
};

/**
 * Takes an HOTP Option object and provides presets for
 * some of the missing required HOTP option fields and validates
 * the resultant options.
 */
export function hotpOptions(opt: Readonly<Partial<HOTPOptions>>): HOTPOptions {
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

/**
 * This is a helper method which provides a common set of steps
 * during class initialisation.
 *
 * It is mainly for use internally by ".clone()" and ".create()" class methods.
 *
 * @param OTP - Class object that you want to initialise (eg: HOTP).
 * @param defaultOptions - Persistent options.
 * @param options - Transient options that can be reset.
 */
export function createInstance<T extends HOTPOptions, S extends HOTP<T>>(
  OTP: { new (opt: Partial<T>): S },
  defaultOptions: Partial<T>,
  options: Partial<T> = {}
): S {
  const instance = new OTP(defaultOptions);
  instance.options = options;
  return instance;
}

/**
 * A class wrapper containing all HOTP methods.
 */
export class HOTP<T extends HOTPOptions = HOTPOptions> {
  /**
   * Default options for an instance.
   *
   * These options **WILL PERSIST** even when [[resetOptions]] is called.
   */
  protected _defaultOptions: Readonly<Partial<T>>;

  /**
   * Transient options for an instance.
   *
   * Values set here will take precedence over the same options that
   * are set in [[_defaultOptions]].
   *
   * These options **WILL NOT PERSIST** upon calling [[resetOptions]].
   */
  protected _options: Readonly<Partial<T>>;

  /**
   * Constructs the class with defaultOptions set.
   *
   * @param defaultOptions used to override or add existing defaultOptions.
   */
  public constructor(defaultOptions: Partial<T> = {}) {
    this._defaultOptions = Object.freeze({ ...defaultOptions });
    this._options = Object.freeze({});
  }

  /**
   * Creates a new HOTP instance with all defaultOptions and options reset.
   *
   * This is the same as calling `new HOTP()`
   */
  public create(defaultOptions: Partial<T> = {}): HOTP<T> {
    return createInstance<T, HOTP<T>>(HOTP, defaultOptions);
  }

  /**
   * Copies the defaultOptions and options from the current
   * HOTP instance and applies the provided defaultOptions.
   */
  public clone(defaultOptions: Partial<T> = {}): HOTP<T> {
    return createInstance<T, HOTP<T>>(
      HOTP,
      { ...this._defaultOptions, ...defaultOptions },
      this._options
    );
  }

  /**
   * - The options **getter** will return all [[_options]],
   * including those set into [[_defaultOptions]].
   */
  public get options(): Partial<T> {
    return Object.freeze({
      ...this._defaultOptions,
      ...this._options
    });
  }

  /**
   * - The options **setter** sets values into [[_options]].
   */
  public set options(options: Partial<T>) {
    this._options = Object.freeze({
      ...this._options,
      ...options
    });
  }

  /**
   * Returns class options polyfilled with some of
   * the missing required options.
   *
   * Reference: [[hotpOptions]]
   */
  public allOptions(): Readonly<T> {
    return Object.freeze(
      hotpOptions({
        ...this._defaultOptions,
        ...this._options
      })
    ) as Readonly<T>;
  }

  /**
   * Resets the current options. Does not reset default options.
   *
   * Default options are those that are specified during class
   * inititialisation, when calling [[clone]] or when calling [[create]]
   */
  public resetOptions(): void {
    this._options = Object.freeze({});
  }

  /**
   * Reference: [[hotpToken]]
   */
  public generate(secret: SecretKey, counter: number): string {
    return hotpToken(secret, counter, this.allOptions());
  }

  /**
   * Reference: [[hotpCheck]]
   */
  public check(token: string, secret: SecretKey, counter: number): boolean {
    return hotpCheck(token, secret, counter, this.allOptions());
  }

  /**
   * Same as [[check]] but accepts a single object based argument.
   */
  public verify(opts: {
    token: string;
    secret: SecretKey;
    counter: number;
  }): boolean {
    if (!opts || typeof opts !== 'object') {
      throw new Error(
        `Expecting argument to be an object. Received ${typeof opts}`
      );
    }

    return this.check(opts.token, opts.secret, opts.counter);
  }

  /**
   * Calls [keyuri](../#keyuri) with class options and type
   * set to HOTP.
   */
  public keyuri(
    accountName: string,
    issuer: string,
    secret: SecretKey,
    counter?: number
  ): string {
    const options = this.allOptions();

    return keyuri({
      algorithm: options.algorithm,
      digits: options.digits,
      type: Strategy.HOTP,
      accountName,
      counter,
      issuer,
      secret
    });
  }
}
