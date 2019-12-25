import {
  AuthenticatorOptions,
  Base32SecretKey,
  HexString,
  SecretKey,
  authenticatorDecoder,
  authenticatorEncoder,
  authenticatorOptions,
  totpToken
} from '@otplib/core';
import { TOTPAsync, totpCheckWithWindowAsync, totpDigestAsync } from './totp';

/**
 * Allow AuthenticatorOptions to accept async method options.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthenticatorAsyncOptions<T = Promise<string>>
  extends AuthenticatorOptions<T> {}

/**
 * Generates the digest for Authenticator based tokens.
 *
 * Uses [[totpDigestAsync]].
 */
export async function authenticatorDigestAsync<
  T extends AuthenticatorAsyncOptions = AuthenticatorAsyncOptions
>(secret: Base32SecretKey, options: Readonly<T>): Promise<HexString> {
  const decodedSecret = await authenticatorDecoder<T>(secret, options);
  return totpDigestAsync<T>(decodedSecret, options);
}

/**
 * Async version of [[authenticatorToken]].
 */
export async function authenticatorTokenAsync<
  T extends AuthenticatorAsyncOptions = AuthenticatorAsyncOptions
>(secret: Base32SecretKey, options: Readonly<T>): Promise<string> {
  const digest = await authenticatorDigestAsync<T>(secret, options);
  return totpToken<T>(secret, { ...options, digest });
}

/**
 * Async version of [[authenticatorCheckWithWindow]].
 */
export async function authenticatorCheckWithWindowAsync<
  T extends AuthenticatorAsyncOptions = AuthenticatorAsyncOptions
>(
  token: string,
  secret: Base32SecretKey,
  options: Readonly<T>
): Promise<number | null> {
  const decodedSecret = await authenticatorDecoder<T>(secret, options);
  return totpCheckWithWindowAsync<T>(token, decodedSecret, options);
}

export async function authenticatorGenerateSecretAsync<
  T extends AuthenticatorAsyncOptions = AuthenticatorAsyncOptions
>(
  numberOfBytes: number,
  options: Pick<T, 'keyEncoder' | 'encoding' | 'createRandomBytes'>
): Promise<Base32SecretKey> {
  const key = await options.createRandomBytes(numberOfBytes, options.encoding);
  return authenticatorEncoder<T>(key, options);
}

/**
 * Async version of [[Authenticator]].
 */
export class AuthenticatorAsync<
  T extends AuthenticatorAsyncOptions = AuthenticatorAsyncOptions
> extends TOTPAsync<T> {
  public create(defaultOptions: Partial<T> = {}): AuthenticatorAsync<T> {
    return new AuthenticatorAsync<T>(defaultOptions);
  }

  public allOptions(): Readonly<T> {
    return authenticatorOptions<T>(this.options);
  }

  public async generate(secret: SecretKey): Promise<string> {
    return authenticatorTokenAsync<T>(secret, this.allOptions());
  }

  public async checkDelta(
    token: string,
    secret: SecretKey
  ): Promise<number | null> {
    return authenticatorCheckWithWindowAsync(token, secret, this.allOptions());
  }

  public async encode(secret: SecretKey): Promise<Base32SecretKey> {
    return authenticatorEncoder<T>(secret, this.allOptions());
  }

  public async decode(secret: Base32SecretKey): Promise<SecretKey> {
    return authenticatorDecoder<T>(secret, this.allOptions());
  }

  public async generateSecret(numberOfBytes = 10): Promise<Base32SecretKey> {
    return authenticatorGenerateSecretAsync<T>(
      numberOfBytes,
      this.allOptions()
    );
  }
}
