import {
  CreateHmacKey,
  HOTP,
  HOTPOptions,
  HashAlgorithms,
  HexString,
  KeyEncodings,
  SecretKey,
  Strategy,
  createInstance,
  hotpOptionsValidator,
  hotpToken,
  isTokenValid,
  keyuri,
  objectValues
} from 'otplib-hotp';

const HASH_ALGORITHMS = objectValues<typeof HashAlgorithms>(HashAlgorithms);

/**
 * Interface for options used in TOTP.
 *
 * Contains additional options in addition to
 * those within HOTP.
 */
export interface TOTPOptions extends HOTPOptions {
  /** The starting time since the JavasSript epoch (seconds) (UNIX epoch * 1000). */
  epoch: number;
  /** Time step (seconds). */
  step: number;
  /** How many windows (x * step) past and future do we consider as valid during check. */
  window: number | [number, number];
}

/**
 * Validates the given [[TOTPOptions]].
 */
export function totpOptionsValidator(
  options: Readonly<Partial<TOTPOptions>>
): void {
  hotpOptionsValidator(options);

  if (typeof options.epoch !== 'number') {
    throw new Error('Expecting options.epoch to be a number.');
  }

  if (typeof options.step !== 'number') {
    throw new Error('Expecting options.step to be a number.');
  }
}

/**
 * Generates the counter based on the current epoch and step.
 * This dynamic counter is used in the HOTP algorithm.
 *
 * @param epoch - Reference: [[TOTPOptions.epoch]]
 * @param step - Reference: [[TOTPOptions.step]]
 */
export function totpCounter(epoch: number, step: number): number {
  return Math.floor(epoch / step / 1000);
}

/**
 * Generates a Time-based One-time Token (TOTP)
 *
 * tl;dr: TOTP = HOTP + counter based on current time.
 *
 * **References**
 *
 * -   http://tools.ietf.org/html/rfc6238
 * -   http://en.wikipedia.org/wiki/Time-based_One-time_Password_Algorithm
 *
 */
export function totpToken(
  secret: SecretKey,
  options: Readonly<TOTPOptions>
): string {
  const counter = totpCounter(options.epoch, options.step);
  return hotpToken(secret, counter, options);
}

/**
 * Checks the given token against the system generated token.
 *
 * **Note**: Token is valid only if it is a number string.
 */
export function totpCheck(
  token: string,
  secret: SecretKey,
  options: Readonly<TOTPOptions>
): boolean {
  if (!isTokenValid(token)) {
    return false;
  }

  const systemToken = totpToken(secret, options);
  return token === systemToken;
}

/**
 * Validates and formats the given window into an array
 * containing how many windows past and future to check.
 */
function getWindowBounds(win: number | [number, number]): [number, number] {
  if (typeof win === 'number') {
    return [win, win];
  }

  if (
    Array.isArray(win) &&
    typeof win[0] === 'number' &&
    typeof win[1] === 'number'
  ) {
    return [win[0], win[1]];
  }

  throw new Error(
    'Expecting options.window to be an number or [number, number].'
  );
}

type TOTPCheckRunner = (direction: 1 | -1, rounds: number) => number | null;

/**
 * Creats a method which will loop-check TOTP validity by
 * the specified number of windows in the specified
 * direction (past or future).
 */
function createTOTPCheckRunner(
  token: string,
  secret: SecretKey,
  options: Readonly<TOTPOptions>
): TOTPCheckRunner {
  const delta = options.step * 1000;
  const epoch = options.epoch;

  return (direction: 1 | -1, rounds: number): number | null => {
    for (let i = 1; i <= rounds; i++) {
      const position = direction * i;

      const currentOptions = {
        ...options,
        epoch: epoch + position * delta
      };

      if (totpCheck(token, secret, currentOptions)) {
        return position;
      }
    }

    return null;
  };
}

/**
 * Checks the provided OTP token against system generated token
 * with support for checking past or future x * step windows.
 *
 * Return values:
 *
 * - null = check failed
 * - positive number = token at future x * step
 * - negative number = token at past x * step
 */
export function totpCheckWithWindow(
  token: string,
  secret: SecretKey,
  options: Readonly<TOTPOptions>
): number | null {
  const bounds = getWindowBounds(options.window);

  if (totpCheck(token, secret, options)) {
    return 0;
  }

  const totpCheckRunner = createTOTPCheckRunner(token, secret, options);
  const backward = totpCheckRunner(-1, bounds[0]);
  return backward !== null ? backward : totpCheckRunner(1, bounds[1]);
}

/**
 * Calculates the number of seconds used in the current tick for TOTP.
 *
 * The start of a new token: `timeUsed() === 0`
 *
 * @param epoch - Reference: [[TOTPOptions.epoch]]
 * @param step - Reference: [[TOTPOptions.step]]
 */
export function totpTimeUsed(epoch: number, step: number): number {
  return Math.floor(epoch / 1000) % step;
}

/**
 * Calculates the number of seconds till next tick for TOTP.
 *
 * The start of a new token: `timeRemaining() === step`
 *
 * @param epoch - Reference: [[TOTPOptions.epoch]]
 * @param step - Reference: [[TOTPOptions.step]]
 */
export function totpTimeRemaining(epoch: number, step: number): number {
  return step - totpTimeUsed(epoch, step);
}

/**
 * Pads the secret to the expected minimum length
 * and returns a hex representation of the string.
 */
export const totpPadSecret = (
  secret: SecretKey,
  encoding: KeyEncodings,
  minLength: number
): HexString => {
  const currentLength = secret.length;
  const hexSecret = Buffer.from(secret, encoding).toString('hex');

  if (currentLength < minLength) {
    const newSecret = new Array(minLength - currentLength + 1).join(hexSecret);
    return Buffer.from(newSecret, 'hex')
      .slice(0, minLength)
      .toString('hex');
  }

  return hexSecret;
};

/**
 * Takes a TOTP secret and derives the HMAC key
 * for use in token generation.
 *
 * In RFC 6238, the secret / seed length for different algorithms
 * are predefined.
 *
 * - HMAC-SHA1 (20 bytes)
 * - HMAC-SHA256 (32 bytes)
 * - HMAC-SHA512 (64 bytes)
 *
 * @param algorithm - Reference: [[TOTPOptions.algorithm]]
 * @param secret
 * @param encoding - Reference: [[TOTPOptions.encoding]]
 */
export const totpCreateHmacKey: CreateHmacKey = (
  algorithm: HashAlgorithms,
  secret: SecretKey,
  encoding: KeyEncodings
): HexString => {
  switch (algorithm) {
    case HashAlgorithms.SHA1:
      return totpPadSecret(secret, encoding, 20);
    case HashAlgorithms.SHA256:
      return totpPadSecret(secret, encoding, 32);
    case HashAlgorithms.SHA512:
      return totpPadSecret(secret, encoding, 64);
    default:
      throw new Error(
        `Expecting algorithm to be one of ${HASH_ALGORITHMS.join(
          ', '
        )}. Received ${algorithm}.`
      );
  }
};

/**
 * Takes an TOTP Option object and provides presets for
 * some of the missing required TOTP option fields and validates
 * the resultant options.
 */
export function totpOptions(opt: Readonly<Partial<TOTPOptions>>): TOTPOptions {
  const options: Partial<TOTPOptions> = {
    algorithm: HashAlgorithms.SHA1,
    createHmacKey: totpCreateHmacKey,
    digits: 6,
    encoding: KeyEncodings.ASCII,
    epoch: Date.now(),
    step: 30,
    window: 0,
    ...opt
  };

  totpOptionsValidator(options);

  return options as TOTPOptions;
}

/**
 * A class wrapper containing all TOTP methods.
 */
export class TOTP<T extends TOTPOptions = TOTPOptions> extends HOTP<T> {
  /**
   * Creates a new TOTP instance with all defaultOptions and options reset.
   *
   * This is the same as calling `new TOTP()`
   */
  public create(defaultOptions: Partial<T> = {}): TOTP<T> {
    return createInstance<T, TOTP<T>>(TOTP, defaultOptions);
  }

  /**
   * Copies the defaultOptions and options from the current
   * TOTP instance and applies the provided defaultOptions.
   */
  public clone(defaultOptions: Partial<T> = {}): TOTP<T> {
    return createInstance<T, TOTP<T>>(
      TOTP,
      { ...this._defaultOptions, ...defaultOptions },
      this._options
    );
  }

  /**
   * Returns class options polyfilled with some of
   * the missing required options.
   *
   * Reference: [[totpOptions]]
   */
  public allOptions(): Readonly<T> {
    return totpOptions({
      ...this._defaultOptions,
      ...this._options
    }) as Readonly<T>;
  }

  /**
   * Reference: [[totpToken]]
   */
  public generate(secret: SecretKey): string {
    return totpToken(secret, this.allOptions());
  }

  /**
   * Reference: [[totpCheckWithWindow]]
   */
  public checkDelta(token: string, secret: SecretKey): number | null {
    return totpCheckWithWindow(token, secret, this.allOptions());
  }

  /**
   * Checks if a given TOTP token matches the generated
   * token at the given epoch (default to current time).
   *
   * This method will return true as long as the token is
   * still within the acceptable time window defined.
   *
   * i.e when [[checkDelta]] returns a number.
   */
  public check(token: string, secret: SecretKey): boolean {
    const delta = this.checkDelta(token, secret);
    return typeof delta === 'number';
  }

  /**
   * Same as [[check]] but accepts a single object based argument.
   */
  public verify(opts: { token: string; secret: SecretKey }): boolean {
    if (!opts || typeof opts !== 'object') {
      throw new Error(
        `Expecting argument to be an object. Received ${typeof opts}`
      );
    }

    return this.check(opts.token, opts.secret);
  }

  /**
   * Reference: [[totpTimeRemaining]]
   */
  public timeRemaining(): number {
    const options = this.allOptions();
    return totpTimeRemaining(options.epoch, options.step);
  }

  /**
   * Reference: [[totpTimeUsed]]
   */
  public timeUsed(): number {
    const options = this.allOptions();
    return totpTimeUsed(options.epoch, options.step);
  }

  /**
   * Calls [keyuri](../#keyuri) with class options and type
   * set to TOTP.
   */
  public keyuri(
    accountName: string,
    issuer: string,
    secret: SecretKey
  ): string {
    const options = this.allOptions();

    return keyuri({
      algorithm: options.algorithm,
      digits: options.digits,
      step: options.step,
      type: Strategy.TOTP,
      accountName,
      issuer,
      secret
    });
  }
}
