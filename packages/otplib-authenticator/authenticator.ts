import {
  HashAlgorithms,
  KeyEncodings,
  SecretKey,
  TOTP,
  TOTPOptions,
  totpCheckWithWindow,
  totpCreateHmacKey,
  totpOptionsValidator,
  totpToken,
  createInstance
} from 'otplib-core';

/**
 * RFC4648 / RFC3548 Base32 String.
 *
 * Other Base32 encoding methods like Crockford's Base32
 * will not be compatible with Google Authenticator.
 */
export type Base32SecretKey = SecretKey;

/**
 * Interface method for [[AuthenticatorOptions.keyEncoder]].
 */
export interface KeyEncoder {
  (secret: SecretKey, encoding: KeyEncodings): Base32SecretKey;
}

/**
 * Interface method for [[AuthenticatorOptions.keyDecoder]].
 */
export interface KeyDecoder {
  (encodedSecret: Base32SecretKey, encoding: KeyEncodings): SecretKey;
}

/**
 * Interface method for [[AuthenticatorOptions.createRandomBytes]].
 */
export interface CreateRandomBytes {
  (size: number, encoding: KeyEncodings): string;
}

/**
 * Interface for options used in Authenticator.
 *
 * Contains additional options in addition to
 * those within TOTP.
 */
export interface AuthenticatorOptions extends TOTPOptions {
  /**
   * Encodes a secret key into a Base32 string before it is
   * sent to the user (in QR Code etc).
   */
  keyEncoder: KeyEncoder;
  /**
   * Decodes the Base32 string given by the user into a secret.
   * */
  keyDecoder: KeyDecoder;
  /**
   * Creates a random string containing the defined number of
   * bytes to be used in generating a secret key.
   */
  createRandomBytes: CreateRandomBytes;
}

/**
 * Validates the given [[AuthenticatorOptions]].
 */
export function authenticatorOptionValidator(
  options: Readonly<Partial<AuthenticatorOptions>>
): void {
  totpOptionsValidator(options);

  if (typeof options.keyDecoder !== 'function') {
    throw new Error('Expecting options.keyDecoder to be a function.');
  }

  if (options.keyEncoder && typeof options.keyEncoder !== 'function') {
    throw new Error('Expecting options.keyEncoder to be a function.');
  }
}

/**
 * Encodes a given secret key into a Base32 secret
 * using a [[KeyEncoder]] method set in the options.
 */
export function authenticatorEncoder(
  secret: SecretKey,
  options: Pick<AuthenticatorOptions, 'keyEncoder' | 'encoding'>
): Base32SecretKey {
  return options.keyEncoder(secret, options.encoding);
}

/**
 * Decodes a given Base32 secret to a secret key
 * using a [[KeyDecoder]] method set in the options.
 */
export function authenticatorDecoder(
  secret: Base32SecretKey,
  options: Pick<AuthenticatorOptions, 'keyDecoder' | 'encoding'>
): SecretKey {
  return options.keyDecoder(secret, options.encoding);
}

/**
 * Generates a random Base32 Secret Key.
 */
export function authenticatorGenerateSecret(
  numberOfBytes: number,
  options: Pick<
    AuthenticatorOptions,
    'keyEncoder' | 'encoding' | 'createRandomBytes'
  >
): Base32SecretKey {
  const key = options.createRandomBytes(numberOfBytes, options.encoding);
  return authenticatorEncoder(key, options);
}

/**
 * Generates the Authenticator based token.
 *
 * tl;dr: Authenticator = TOTP + Base32 Secret
 *
 * **References**
 *
 * -   https://en.wikipedia.org/wiki/Google_Authenticator
 *
 */
export function authenticatorToken(
  secret: Base32SecretKey,
  options: Readonly<AuthenticatorOptions>
): string {
  return totpToken(authenticatorDecoder(secret, options), options);
}

/**
 * Decodes the encodedSecret and passes it to [[totpCheckWithWindow]]
 */
export function authenticatorCheckWithWindow(
  token: string,
  secret: Base32SecretKey,
  options: Readonly<AuthenticatorOptions>
): number | null {
  return totpCheckWithWindow(
    token,
    authenticatorDecoder(secret, options),
    options
  );
}

/**
 * Takes an Authenticator Option object and provides presets for
 * some of the missing required Authenticator option fields and validates
 * the resultant options.
 */
export function authenticatorOptions(
  opt: Readonly<Partial<AuthenticatorOptions>>
): AuthenticatorOptions {
  const options: Partial<AuthenticatorOptions> = {
    algorithm: HashAlgorithms.SHA1,
    createHmacKey: totpCreateHmacKey,
    digits: 6,
    encoding: KeyEncodings.HEX,
    epoch: Date.now(),
    step: 30,
    window: 0,
    ...opt
  };

  authenticatorOptionValidator(options);

  return options as AuthenticatorOptions;
}

/**
 * A class wrapper containing all Authenticator methods.
 */
export class Authenticator<
  T extends AuthenticatorOptions = AuthenticatorOptions
> extends TOTP<T> {
  /**
   * Creates a new Authenticator instance with all defaultOptions and options reset.
   *
   * This is the same as calling `new Authenticator()`
   */
  public create(defaultOptions: Partial<T> = {}): Authenticator<T> {
    return createInstance<T, Authenticator<T>>(Authenticator, defaultOptions);
  }

  /**
   * Copies the defaultOptions and options from the current
   * Authenticator instance and applies the provided defaultOptions.
   */
  public clone(defaultOptions: Partial<T> = {}): Authenticator<T> {
    return createInstance<T, Authenticator<T>>(
      Authenticator,
      { ...this._defaultOptions, ...defaultOptions },
      this._options
    );
  }

  /**
   * Returns a set of options at the current moment,
   * polyfilled with some of the missing required options.
   *
   * Refer to [[authenticatorOptions]]
   */
  public allOptions(): Readonly<T> {
    return authenticatorOptions({
      ...this._defaultOptions,
      ...this._options
    }) as Readonly<T>;
  }

  /**
   * Reference: [[authenticatorToken]]
   */
  public generate(secret: Base32SecretKey): string {
    return authenticatorToken(secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorCheckWithWindow]]
   */
  public checkDelta(token: string, secret: Base32SecretKey): number | null {
    return authenticatorCheckWithWindow(token, secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorEncoder]]
   */
  public encode(secret: SecretKey): Base32SecretKey {
    return authenticatorEncoder(secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorDecoder]]
   */
  public decode(secret: Base32SecretKey): SecretKey {
    return authenticatorDecoder(secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorGenerateSecret]]
   */
  public generateSecret(numberOfBytes: number = 10): Base32SecretKey {
    return authenticatorGenerateSecret(numberOfBytes, this.allOptions());
  }
}
