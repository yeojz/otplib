import {
  HOTPOptions,
  HexString,
  OTP,
  SecretKey,
  hotpCheck,
  hotpCounter,
  hotpKeyuri,
  hotpOptions,
  hotpToken
} from 'otplib-core';

/**
 * Allow HOTPOptions to accept async method options
 */
export type HOTPAsyncOptions = HOTPOptions<Promise<string>>;

/**
 * Generates the digest for HOTP based tokens.
 * Async version of [[hotpDigest]].
 */
export async function hotpDigestAsync<
  T extends HOTPAsyncOptions = HOTPAsyncOptions
>(
  secret: SecretKey,
  counter: number,
  options: Readonly<T>
): Promise<HexString> {
  const hexCounter = hotpCounter(counter);

  const hmacKey = await options.createHmacKey(
    options.algorithm,
    secret,
    options.encoding
  );

  return options.createDigest(options.algorithm, hmacKey, hexCounter);
}

/**
 * Async version of [[hotpToken]].
 */
export async function hotpTokenAsync<
  T extends HOTPAsyncOptions = HOTPAsyncOptions
>(secret: SecretKey, counter: number, options: Readonly<T>): Promise<string> {
  const digest = await hotpDigestAsync<T>(secret, counter, options);
  return hotpToken<T>(secret, counter, { ...options, digest });
}

/**
 * Async version of [[hotpCheck]].
 */
export async function hotpCheckAsync<
  T extends HOTPAsyncOptions = HOTPAsyncOptions
>(
  token: string,
  secret: SecretKey,
  counter: number,
  options: Readonly<T>
): Promise<boolean> {
  const digest = await hotpDigestAsync<T>(secret, counter, options);
  return hotpCheck<T>(token, secret, counter, { ...options, digest });
}

/**
 * Async version of [[HOTP]].
 */
export class HOTPAsync<
  T extends HOTPAsyncOptions = HOTPAsyncOptions
> extends OTP<T> {
  public create(defaultOptions: Partial<T> = {}): HOTPAsync<T> {
    return new HOTPAsync<T>(defaultOptions);
  }

  public allOptions(): Readonly<T> {
    return hotpOptions<T>(this.options);
  }

  public async generate(secret: SecretKey, counter: number): Promise<string> {
    return hotpTokenAsync<T>(secret, counter, this.allOptions());
  }

  public async check(
    token: string,
    secret: SecretKey,
    counter: number
  ): Promise<boolean> {
    return hotpCheckAsync<T>(token, secret, counter, this.allOptions());
  }

  public async verify(opts: {
    token: string;
    secret: SecretKey;
    counter: number;
  }): Promise<boolean> {
    return this.check(opts.token, opts.secret, opts.counter);
  }

  public async keyuri(
    accountName: string,
    issuer: string,
    secret: SecretKey,
    counter: number
  ): Promise<string> {
    return hotpKeyuri<T>(
      accountName,
      issuer,
      secret,
      counter,
      this.allOptions()
    );
  }
}
