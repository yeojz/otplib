/**
 * Secret Key used for OTP generation.
 */
export type SecretKey = string;

/**
 * A hex encoded string.
 */
export type HexString = string;

/**
 * Base interface for all option interfaces.
 * eg: [[HOTPOptions]].
 */
export interface OTPOptions {
  [key: string]: unknown;
}

/**
 * Returns an array of values of the enumerable properties of an object.
 * This is used in place of Object.values for wider platform support.
 *
 * @ignore
 *
 * @param value Object that contains the properties and methods.
 */
export function objectValues<T>(value: T): string[] {
  return Object.keys(value).map(
    (key): string => (value[key as keyof T] as unknown) as string
  );
}

/**
 * Algorithms that are available to be used for
 * calculating the HMAC value
 */
export enum HashAlgorithms {
  'SHA1' = 'sha1',
  'SHA256' = 'sha256',
  'SHA512' = 'sha512'
}

/**
 * Array of [[HashAlgorithms]] enum values
 *
 * @ignore
 */
export const HASH_ALGORITHMS = objectValues<typeof HashAlgorithms>(
  HashAlgorithms
);

/**
 * The encoding format for the [[SecretKey]].
 * This is mostly used for converting the
 * provided secret into a Buffer.
 */
export enum KeyEncodings {
  'ASCII' = 'ascii',
  'BASE64' = 'base64',
  'HEX' = 'hex',
  'LATIN1' = 'latin1',
  'UTF8' = 'utf8'
}

/**
 * Array of [[KeyEncodings]] enum values
 *
 * @ignore
 */
export const KEY_ENCODINGS = objectValues<typeof KeyEncodings>(KeyEncodings);

/**
 * The OTP generation strategies.
 * Either HMAC or Time based.
 */
export enum Strategy {
  'HOTP' = 'hotp',
  'TOTP' = 'totp'
}

/**
 * Array of [[Strategy]] enum values
 *
 * @ignore
 */
export const STRATEGY = objectValues<typeof Strategy>(Strategy);

/**
 * Interface method for formatting the [[SecretKey]] with
 * the algorithm constraints before it is given to [[CreateDigest]].
 */
export interface CreateHmacKey<T = HexString> {
  (algorithm: HashAlgorithms, secret: SecretKey, encoding: KeyEncodings): T;
}

/**
 * Interface method for generating a HMAC digest
 * which is then used to generate the token.
 */
export interface CreateDigest<T = HexString> {
  (algorithm: HashAlgorithms, hmacKey: HexString, counter: HexString): T;
}

/**
 * Inteface for options accepted by keyuri
 */
export interface KeyURIOptions {
  accountName: string;
  algorithm?: HashAlgorithms;
  counter?: number;
  digits?: number;
  issuer?: string;
  label?: string;
  secret: SecretKey;
  step?: number;
  type: Strategy;
}

/**
 * createDigest placholder function which throws an error
 * when it is not replaced with an actual implementation.
 *
 * @ignore
 */
export const createDigestPlaceholder: CreateDigest = (): string => {
  throw new Error('Please provide an options.createDigest implementation.');
};

/**
 * Checks if a string contains a valid token format.
 *
 * @param value - a number string.
 */
export function isTokenValid(value: string): boolean {
  return /^(\d+)$/.test(value);
}

/**
 * Left pad the current string with a given string to a given length.
 *
 * This behaves similarly to String.prototype.padStart
 *
 * @ignore
 *
 * @param value The string to pad.
 * @param maxLength The length of the resulting string once the current string has been padded.
 *  If this parameter is smaller than the current string's length, the current
 *  string will be returned as it is.
 * @param fillString The string to pad the current string with.
 */
export function padStart(
  value: string,
  maxLength: number,
  fillString: string
): string {
  if (value.length >= maxLength) {
    return value;
  }

  const padding = Array(maxLength + 1).join(fillString);
  return `${padding}${value}`.slice(-1 * maxLength);
}

/**
 * Generates an otpauth uri which can be used in a QR Code.
 *
 * Reference: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 *
 * Sample Output: otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
 *
 * **Example**
 *
 * ```js
 * import qrcode from 'qrcode';
 *
 * const otpauth = keyuri({ ... })
 *
 * qrcode.toDataURL(otpauth, (err, imageUrl) => {
 *   if (err) {
 *     console.log('Error with QR');
 *     return;
 *   }
 *   console.log(imageUrl);
 * });
 * ```
 */
export function keyuri(options: KeyURIOptions): string {
  const tmpl = `otpauth://${options.type}/{labelPrefix}:{accountName}?secret={secret}{query}`;
  const params: string[] = [];

  if (STRATEGY.indexOf(options.type) < 0) {
    throw new Error(
      `Expecting options.type to be one of ${STRATEGY.join(', ')}. Received ${
        options.type
      }.`
    );
  }

  if (options.type === 'hotp') {
    if (options.counter == null || typeof options.counter !== 'number') {
      throw new Error(
        'Expecting options.counter to be a number when options.type is "hotp".'
      );
    }

    params.push(`&counter=${options.counter}`);
  }

  if (options.type === 'totp' && options.step) {
    params.push(`&period=${options.step}`);
  }

  if (options.digits) {
    params.push(`&digits=${options.digits}`);
  }

  if (options.algorithm) {
    params.push(`&algorithm=${options.algorithm.toUpperCase()}`);
  }

  if (options.issuer) {
    params.push(`&issuer=${encodeURIComponent(options.issuer)}`);
  }

  return tmpl
    .replace(
      '{labelPrefix}',
      encodeURIComponent(options.issuer || options.accountName)
    )
    .replace('{accountName}', encodeURIComponent(options.accountName))
    .replace('{secret}', options.secret)
    .replace('{query}', params.join(''));
}

/**
 * Base OTP class which provides options management
 * All OTP classes should be extended from this class.
 */
export class OTP<T extends OTPOptions = OTPOptions> {
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
   * Creates a new instance with all defaultOptions and options reset.
   */
  public create(defaultOptions: Partial<T> = {}): OTP<T> {
    return new OTP<T>(defaultOptions);
  }

  /**
   * Copies the defaultOptions and options from the current
   * instance and applies the provided defaultOptions.
   */
  public clone(defaultOptions: Partial<T> = {}): ReturnType<this['create']> {
    const instance = this.create({
      ...this._defaultOptions,
      ...defaultOptions
    });
    instance.options = this._options;
    return instance as ReturnType<this['create']>;
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
    return this.options as Readonly<T>;
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
}
