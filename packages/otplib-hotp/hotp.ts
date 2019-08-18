import {
  CreateDigest,
  CreateHmacKey,
  HASH_ALGORITHMS,
  HashAlgorithms,
  HexString,
  KEY_ENCODINGS,
  KeyEncodings,
  OTP,
  OTPOptions,
  SecretKey,
  Strategy,
  createDigestPlaceholder,
  isTokenValid,
  keyuri,
  padStart
} from './utils';

/**
 * Interface for options used in HOTP.
 */
export interface HOTPOptions<T = string> extends OTPOptions {
  /**
   * Creates the digest which token is derived from.
   */
  createDigest: CreateDigest<T>;
  /**
   * Formats the secret into a HMAC key, applying transformations (like padding) where needed
   */
  createHmacKey: CreateHmacKey<T>;
  /**
   * The algorithm used for calculating the HMAC.
   */
  algorithm: HashAlgorithms;
  /**
   * **CAUTION NEEDED:** Given the same digest, the same token will be received.
   *
   * This is provided for unique use cases. For example, digest generation might
   * depend on an async API.
   */
  digest?: HexString;
  /**
   * The number of digits a token will have. Usually 6 or 8.
   */
  digits: number;
  /**
   * The encoding that was used on the secret.
   */
  encoding: KeyEncodings;
}

/**
 * Validates the given [[HOTPOptions]]
 */
export function hotpOptionsValidator<
  T extends HOTPOptions<unknown> = HOTPOptions<unknown>
>(options: Readonly<Partial<T>>): void {
  if (typeof options.createDigest !== 'function') {
    throw new Error('Expecting options.createDigest to be a function.');
  }

  if (typeof options.createHmacKey !== 'function') {
    throw new Error('Expecting options.createHmacKey to be a function.');
  }

  if (typeof options.digits !== 'number') {
    throw new Error('Expecting options.digits to be a number.');
  }

  if (
    !options.algorithm ||
    HASH_ALGORITHMS.indexOf(options.algorithm as string) < 0
  ) {
    throw new Error(
      `Expecting options.algorithm to be one of ${HASH_ALGORITHMS.join(
        ', '
      )}. Received ${options.algorithm}.`
    );
  }

  if (
    !options.encoding ||
    KEY_ENCODINGS.indexOf(options.encoding as string) < 0
  ) {
    throw new Error(
      `Expecting options.encoding to be one of ${KEY_ENCODINGS.join(
        ', '
      )}. Received ${options.encoding}.`
    );
  }
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
 * Returns the default options for HOTP
 */
export function hotpDefaultOptions<
  T extends HOTPOptions<unknown> = HOTPOptions<unknown>
>(): Partial<T> {
  const options = {
    algorithm: HashAlgorithms.SHA1,
    createHmacKey: hotpCreateHmacKey,
    createDigest: createDigestPlaceholder,
    digits: 6,
    encoding: KeyEncodings.ASCII
  };

  return (options as unknown) as Partial<T>;
}

/**
 * Takes an HOTP Option object and provides presets for
 * some of the missing required HOTP option fields and validates
 * the resultant options.
 */
export function hotpOptions<
  T extends HOTPOptions<unknown> = HOTPOptions<unknown>
>(opt: Readonly<Partial<T>>): Readonly<T> {
  const options = {
    ...hotpDefaultOptions<T>(),
    ...opt
  };

  hotpOptionsValidator<T>(options);
  return Object.freeze(options) as Readonly<T>;
}

/**
 * Formats a given counter into a string counter.
 */
export function hotpCounter(counter: number): HexString {
  const hexCounter = counter.toString(16);
  return padStart(hexCounter, 16, '0');
}

/**
 * Converts a digest to a token of a specified length.
 */
export function hotpDigestToToken(
  hexDigest: HexString,
  digits: number
): string {
  const digest = Buffer.from(hexDigest, 'hex');
  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const token = binary % Math.pow(10, digits);
  return padStart(String(token), digits, '0');
}

/**
 * Executes options.createHmacKey options.createDigest with
 * given paramters and generates the digest required for token generation.
 */
function hotpDigest<T extends HOTPOptions = HOTPOptions>(
  secret: SecretKey,
  counter: number,
  options: Readonly<T>
): HexString {
  const hexCounter = hotpCounter(counter);

  const hmacKey = options.createHmacKey(
    options.algorithm,
    secret,
    options.encoding
  );

  return options.createDigest(options.algorithm, hmacKey, hexCounter);
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
export function hotpToken<
  T extends HOTPOptions<unknown> = HOTPOptions<unknown>
>(secret: SecretKey, counter: number, options: Readonly<T>): string {
  const hexDigest =
    options.digest ||
    hotpDigest<HOTPOptions>(secret, counter, options as HOTPOptions);

  return hotpDigestToToken(hexDigest as HexString, options.digits);
}

/**
 * Checks the given token against the system generated token.
 *
 * **Note**: Token is valid only if it is a number string
 */
export function hotpCheck<
  T extends HOTPOptions<unknown> = HOTPOptions<unknown>
>(
  token: string,
  secret: SecretKey,
  counter: number,
  options: Readonly<T>
): boolean {
  if (!isTokenValid(token)) {
    return false;
  }

  const systemToken = hotpToken<T>(secret, counter, options);
  return token === systemToken;
}

/**
 * Calls [keyuri](../#keyuri) with class options and type
 * set to HOTP.
 */
export function hotpKeyuri<
  T extends HOTPOptions<unknown> = HOTPOptions<unknown>
>(
  accountName: string,
  issuer: string,
  secret: SecretKey,
  counter: number,
  options: Readonly<T>
): string {
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

/**
 * A class wrapper containing all HOTP methods.
 */
export class HOTP<T extends HOTPOptions = HOTPOptions> extends OTP<T> {
  /**
   * Creates a new instance with all defaultOptions and options reset.
   */
  public create(defaultOptions: Partial<T> = {}): HOTP<T> {
    return new HOTP<T>(defaultOptions);
  }

  /**
   * Returns class options polyfilled with some of
   * the missing required options.
   *
   * Reference: [[hotpOptions]]
   */
  public allOptions(): Readonly<T> {
    return hotpOptions<T>(this.options);
  }

  /**
   * Reference: [[hotpToken]]
   */
  public generate(secret: SecretKey, counter: number): string {
    return hotpToken<T>(secret, counter, this.allOptions());
  }

  /**
   * Reference: [[hotpCheck]]
   */
  public check(token: string, secret: SecretKey, counter: number): boolean {
    return hotpCheck<T>(token, secret, counter, this.allOptions());
  }

  /**
   * Same as [[check]] but accepts a single object based argument.
   */
  public verify(opts: {
    token: string;
    secret: SecretKey;
    counter: number;
  }): boolean {
    if (typeof opts !== 'object') {
      throw new Error('Expecting argument 0 of verify to be an object');
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
    counter: number
  ): string {
    return hotpKeyuri<T>(
      accountName,
      issuer,
      secret,
      counter,
      this.allOptions()
    );
  }
}
