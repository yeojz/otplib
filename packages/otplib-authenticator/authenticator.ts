import { HashAlgorithms, KeyEncodings, SecretKey } from 'otplib-hotp';
import {
  TOTP,
  TOTPOptions,
  totpCheckWithWindow,
  totpCreateHmacKey,
  totpOptionsValidator,
  totpToken
} from 'otplib-totp';

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
export function authenticatorOptionValidator<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(options: Partial<T>): void {
  totpOptionsValidator<T>(options);

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
export function authenticatorEncoder<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(
  secret: SecretKey,
  options: Pick<T, 'keyEncoder' | 'encoding'>
): Base32SecretKey {
  return options.keyEncoder(secret, options.encoding);
}

/**
 * Decodes a given Base32 secret to a secret key
 * using a [[KeyDecoder]] method set in the options.
 */
export function authenticatorDecoder<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(
  secret: Base32SecretKey,
  options: Pick<T, 'keyDecoder' | 'encoding'>
): SecretKey {
  return options.keyDecoder(secret, options.encoding);
}

/**
 * Generates a random Base32 Secret Key.
 */
export function authenticatorGenerateSecret<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(
  numberOfBytes: number,
  options: Pick<T, 'keyEncoder' | 'encoding' | 'createRandomBytes'>
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
export function authenticatorToken<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(secret: Base32SecretKey, options: Readonly<T>): string {
  return totpToken<T>(authenticatorDecoder<T>(secret, options), options);
}

/**
 * Decodes the encodedSecret and passes it to [[totpCheckWithWindow]]
 */
export function authenticatorCheckWithWindow<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(token: string, secret: Base32SecretKey, options: Readonly<T>): number | null {
  return totpCheckWithWindow<T>(
    token,
    authenticatorDecoder<T>(secret, options),
    options
  );
}

/**
 * Returns a set of default options for authenticator at the current epoch.
 */
export function authenticatorDefaultOptions<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(): Partial<T> {
  const options = {
    algorithm: HashAlgorithms.SHA1,
    createHmacKey: totpCreateHmacKey,
    digits: 6,
    encoding: KeyEncodings.HEX,
    epoch: Date.now(),
    step: 30,
    window: 0
  };

  return options as Partial<T>;
}

/**
 * Takes an Authenticator Option object and provides presets for
 * some of the missing required Authenticator option fields and validates
 * the resultant options.
 */
export function authenticatorOptions<
  T extends AuthenticatorOptions = AuthenticatorOptions
>(opt: Partial<T>): Readonly<T> {
  const options = {
    ...authenticatorDefaultOptions(),
    ...opt
  };

  authenticatorOptionValidator<T>(options as Partial<T>);

  return Object.freeze(options) as Readonly<T>;
}

/**
 * A class wrapper containing all Authenticator methods.
 */
export class Authenticator<
  T extends AuthenticatorOptions = AuthenticatorOptions
> extends TOTP<T> {
  /**
   * Creates a new instance with all defaultOptions and options reset.
   */
  public create(defaultOptions: Partial<T> = {}): Authenticator<T> {
    return new Authenticator<T>(defaultOptions);
  }

  /**
   * Returns a set of options at the current moment,
   * polyfilled with some of the missing required options.
   *
   * Refer to [[authenticatorOptions]]
   */
  public allOptions(): Readonly<T> {
    return authenticatorOptions<T>({
      ...this._defaultOptions,
      ...this._options
    });
  }

  /**
   * Reference: [[authenticatorToken]]
   */
  public generate(secret: Base32SecretKey): string {
    return authenticatorToken<T>(secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorCheckWithWindow]]
   */
  public checkDelta(token: string, secret: Base32SecretKey): number | null {
    return authenticatorCheckWithWindow<T>(token, secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorEncoder]]
   */
  public encode(secret: SecretKey): Base32SecretKey {
    return authenticatorEncoder<T>(secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorDecoder]]
   */
  public decode(secret: Base32SecretKey): SecretKey {
    return authenticatorDecoder<T>(secret, this.allOptions());
  }

  /**
   * Reference: [[authenticatorGenerateSecret]]
   */
  public generateSecret(numberOfBytes: number = 10): Base32SecretKey {
    return authenticatorGenerateSecret<T>(numberOfBytes, this.allOptions());
  }
}
