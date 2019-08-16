import {
  CreateHmacKey,
  HOTP,
  HOTPOptions,
  HashAlgorithms,
  HexString,
  KeyEncodings,
  SecretKey,
  Strategy,
  hotpOptionsValidator,
  hotpToken,
  isTokenValid,
  keyuri,
  objectValues
} from 'otplib-hotp';

const HASH_ALGORITHMS = objectValues<typeof HashAlgorithms>(HashAlgorithms);

/**
 * Validates and formats the given window into an array
 * containing how many windows past and future to check.
 */
function parseWindowBounds(win?: number | [number, number]): [number, number] {
  if (typeof win === 'number') {
    return [Math.abs(win), Math.abs(win)];
  }

  if (Array.isArray(win)) {
    const [past, future] = win;

    if (typeof past === 'number' && typeof future === 'number') {
      return [Math.abs(past), Math.abs(future)];
    }
  }

  throw new Error(
    'Expecting options.window to be an number or [number, number].'
  );
}

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
export function totpOptionsValidator<T extends TOTPOptions = TOTPOptions>(
  options: Partial<T>
): void {
  hotpOptionsValidator<T>(options);
  parseWindowBounds(options.window);

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
export function totpToken<T extends TOTPOptions = TOTPOptions>(
  secret: SecretKey,
  options: Readonly<T>
): string {
  const counter = totpCounter(options.epoch, options.step);
  return hotpToken(secret, counter, options);
}

function generateEpoch(
  epoch: number,
  direction: number,
  deltaPerEpoch: number,
  numOfEpoches: number
): number[] {
  const result: number[] = [];

  if (numOfEpoches === 0) {
    return result;
  }

  for (let i = 1; i <= numOfEpoches; i++) {
    const delta = direction * i * deltaPerEpoch;
    result.push(epoch + delta);
  }

  return result;
}

/**
 * Interface for available epoches derived from
 * the current epoch.
 */
export interface EpochAvailable {
  current: number;
  future: number[];
  past: number[];
}

/**
 * Gets a set of epoches derived from
 * the current epoch and the acceptable window.
 */
export function totpEpochAvailable<T extends TOTPOptions = TOTPOptions>(
  options: Readonly<Pick<T, 'window' | 'epoch' | 'step'>>
): EpochAvailable {
  const bounds = parseWindowBounds(options.window);
  const epoch = options.epoch;
  const delta = options.step * 1000; // to JS Time

  return {
    current: epoch,
    past: generateEpoch(epoch, -1, delta, bounds[0]),
    future: generateEpoch(epoch, 1, delta, bounds[1])
  };
}

/**
 * Checks the given token against the system generated token.
 *
 * **Note**: Token is valid only if it is a number string.
 */
export function totpCheck<T extends TOTPOptions = TOTPOptions>(
  token: string,
  secret: SecretKey,
  options: Readonly<T>
): boolean {
  if (!isTokenValid(token)) {
    return false;
  }

  const systemToken = totpToken(secret, options);
  return token === systemToken;
}

/**
 * Checks if there is a valid TOTP token in a given list of epoches.
 * Returns the (index + 1) of a valid epoch in the list.
 */
export function totpCheckByEpoch<T extends TOTPOptions = TOTPOptions>(
  epoches: number[],
  token: string,
  secret: SecretKey,
  options: Readonly<T>
): number | null {
  let position = null;

  epoches.some((epoch, idx): boolean => {
    const result = totpCheck<T>(token, secret, {
      ...options,
      epoch
    });

    if (result) {
      position = idx + 1;
      return true;
    }

    return false;
  });

  return position;
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
export function totpCheckWithWindow<T extends TOTPOptions = TOTPOptions>(
  token: string,
  secret: SecretKey,
  options: Readonly<T>
): number | null {
  if (totpCheck(token, secret, options)) {
    return 0;
  }

  const epoches = totpEpochAvailable<T>(options);
  const backward = totpCheckByEpoch<T>(epoches.past, token, secret, options);

  if (backward !== null) {
    return backward * -1;
  }

  return totpCheckByEpoch<T>(epoches.future, token, secret, options);
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
 * Returns a set of default options for TOTP at the current epoch.
 */
export function totpDefaultOptions<
  T extends TOTPOptions = TOTPOptions
>(): Partial<T> {
  const options = {
    algorithm: HashAlgorithms.SHA1,
    createHmacKey: totpCreateHmacKey,
    digits: 6,
    encoding: KeyEncodings.ASCII,
    epoch: Date.now(),
    step: 30,
    window: 0
  };

  return options as Partial<T>;
}

/**
 * Takes an TOTP Option object and provides presets for
 * some of the missing required TOTP option fields and validates
 * the resultant options.
 */
export function totpOptions<T extends TOTPOptions = TOTPOptions>(
  opt: Partial<T>
): Readonly<T> {
  const options = {
    ...totpDefaultOptions<T>(),
    ...opt
  };

  totpOptionsValidator<T>(options as Partial<T>);

  return Object.freeze(options) as Readonly<T>;
}

/**
 * A class wrapper containing all TOTP methods.
 */
export class TOTP<T extends TOTPOptions = TOTPOptions> extends HOTP<T> {
  /**
   * Creates a new instance with all defaultOptions and options reset.
   */
  public create(defaultOptions: Partial<T>): TOTP<T> {
    return new TOTP<T>(defaultOptions);
  }

  /**
   * Returns class options polyfilled with some of
   * the missing required options.
   *
   * Reference: [[totpOptions]]
   */
  public allOptions(): Readonly<T> {
    return totpOptions<T>({
      ...this._defaultOptions,
      ...this._options
    });
  }

  /**
   * Reference: [[totpToken]]
   */
  public generate(secret: SecretKey): string {
    return totpToken<T>(secret, this.allOptions());
  }

  /**
   * Reference: [[totpCheckWithWindow]]
   */
  public checkDelta(token: string, secret: SecretKey): number | null {
    return totpCheckWithWindow<T>(token, secret, this.allOptions());
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
