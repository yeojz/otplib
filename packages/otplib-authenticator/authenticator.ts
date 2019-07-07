import {
  HashAlgorithms,
  KeyEncodings,
  TOTP,
  TOTPOptions,
  totpCheckWithWindow,
  totpCreateHmacKey,
  totpOptionsValidator,
  totpToken
} from 'packages/otplib-core';

export type RFC4648String = string;

export interface KeyEncoder {
  (secret: string, encoding: KeyEncodings): RFC4648String;
}

export interface KeyDecoder {
  (encodedSecret: RFC4648String, encoding: KeyEncodings): string;
}

export interface CreateRandomBytes {
  (size: number, encoding: KeyEncodings): string;
}

export interface AuthenticatorOptions extends TOTPOptions {
  keyEncoder: KeyEncoder;
  keyDecoder: KeyDecoder;
  createRandomBytes: CreateRandomBytes;
}

export function authenticatorOptionValidator(
  options: Partial<AuthenticatorOptions>
): void {
  totpOptionsValidator(options);

  if (typeof options.keyDecoder !== 'function') {
    throw new Error('Expecting options.keyDecoder to be a function.');
  }

  if (options.keyEncoder && typeof options.keyEncoder !== 'function') {
    throw new Error('Expecting options.keyEncoder to be a function.');
  }
}

export function authenticatorToken(
  secret: string,
  options: AuthenticatorOptions
): string {
  return totpToken(options.keyDecoder(secret, options.encoding), options);
}

export function authenticatorCheckWithWindow(
  token: string,
  encodedSecret: string,
  options: AuthenticatorOptions
): number | null {
  const secret = options.keyDecoder(encodedSecret, options.encoding);
  return totpCheckWithWindow(token, secret, options);
}

export function authenticatorOptions(
  opt: Partial<AuthenticatorOptions>
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

export class Authenticator<
  T extends AuthenticatorOptions = AuthenticatorOptions
> extends TOTP<T> {
  public finalOptions(): T {
    return authenticatorOptions(this.options) as T;
  }

  public generate(secret: string): string {
    return authenticatorToken(secret, this.finalOptions());
  }

  public checkDelta(token: string, secret: string): number | null {
    return authenticatorCheckWithWindow(token, secret, this.finalOptions());
  }

  public encode(secret: string): RFC4648String {
    const options = this.finalOptions();
    return options.keyEncoder(secret, options.encoding);
  }

  public decode(encodedSecret: RFC4648String): string {
    const options = this.finalOptions();
    return options.keyDecoder(encodedSecret, options.encoding);
  }

  public generateSecret(numberOfBytes: number = 20): RFC4648String {
    const options = this.finalOptions();
    const key = options.createRandomBytes(numberOfBytes, options.encoding);
    return this.encode(key);
  }
}
