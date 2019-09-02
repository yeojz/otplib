import {
  HexString,
  SecretKey,
  TOTPOptions,
  totpCheck,
  totpCounter,
  totpEpochAvailable,
  totpKeyuri,
  totpOptions,
  totpTimeRemaining,
  totpTimeUsed,
  totpToken
} from 'otplib-core';
import { HOTPAsync, hotpDigestAsync } from './hotp';

/**
 * Allow TOTPOptions to accept async method options.
 */
export type TOTPAsyncOptions = TOTPOptions<Promise<string>>;

/**
 * Generates the digest for TOTP based tokens.
 *
 * Uses [[hotpDigestAsync]].
 */
export async function totpDigestAsync<
  T extends TOTPAsyncOptions = TOTPAsyncOptions
>(secret: SecretKey, options: Readonly<T>): Promise<HexString> {
  const counter = totpCounter(options.epoch, options.step);
  return hotpDigestAsync<T>(secret, counter, options);
}

/**
 * Async version of [[totpToken]].
 */
export async function totpTokenAsync<
  T extends TOTPAsyncOptions = TOTPAsyncOptions
>(secret: SecretKey, options: Readonly<T>): Promise<string> {
  const digest = await totpDigestAsync<T>(secret, options);
  return totpToken<T>(secret, { ...options, digest });
}

/**
 * Async version of [[totpCheck]].
 */
export async function totpCheckAsync<
  T extends TOTPAsyncOptions = TOTPAsyncOptions
>(token: string, secret: SecretKey, options: Readonly<T>): Promise<boolean> {
  const digest = await totpDigestAsync<T>(secret, options);
  return totpCheck<T>(token, secret, { ...options, digest });
}

/**
 * Async version of [[totpCheckByEpoch]].
 */
export async function totpCheckByEpochAsync<
  T extends TOTPAsyncOptions = TOTPAsyncOptions
>(
  epochs: number[],
  token: string,
  secret: SecretKey,
  options: Readonly<T>
): Promise<number | null> {
  let position = null;

  const digests = await Promise.all(
    epochs.map(
      (epoch): Promise<HexString> =>
        totpDigestAsync<T>(secret, { ...options, epoch })
    )
  );

  digests.some((digest, idx): boolean => {
    const result = totpCheck<T>(token, secret, { ...options, digest });

    if (result) {
      position = idx + 1;
      return true;
    }

    return false;
  });

  return position;
}

/**
 * Async version of [[totpCheckWithWindow]].
 */
export async function totpCheckWithWindowAsync<
  T extends TOTPAsyncOptions = TOTPAsyncOptions
>(
  token: string,
  secret: SecretKey,
  options: Readonly<T>
): Promise<number | null> {
  const checkZero = await totpCheckAsync<T>(token, secret, options);
  if (checkZero) {
    return 0;
  }

  const epochs = totpEpochAvailable(
    options.epoch,
    options.step,
    options.window
  );
  const backward = await totpCheckByEpochAsync<T>(
    epochs.past,
    token,
    secret,
    options
  );

  if (backward !== null) {
    return backward * -1;
  }

  return totpCheckByEpochAsync<T>(epochs.future, token, secret, options);
}

/**
 * Async version of [[TOTP]].
 */
export class TOTPAsync<
  T extends TOTPAsyncOptions = TOTPAsyncOptions
> extends HOTPAsync<T> {
  public create(defaultOptions: Partial<T> = {}): TOTPAsync<T> {
    return new TOTPAsync<T>(defaultOptions);
  }

  public allOptions(): Readonly<T> {
    return totpOptions<T>(this.options);
  }

  public async generate(secret: SecretKey): Promise<string> {
    return totpTokenAsync<T>(secret, this.allOptions());
  }

  public async checkDelta(
    token: string,
    secret: SecretKey
  ): Promise<number | null> {
    return totpCheckWithWindowAsync<T>(token, secret, this.allOptions());
  }

  public async check(token: string, secret: SecretKey): Promise<boolean> {
    const delta = await this.checkDelta(token, secret);
    return typeof delta === 'number';
  }

  public async verify(opts: {
    token: string;
    secret: SecretKey;
  }): Promise<boolean> {
    return this.check(opts.token, opts.secret);
  }

  public async timeRemaining(): Promise<number> {
    const options = this.allOptions();
    return totpTimeRemaining(options.epoch, options.step);
  }

  public async timeUsed(): Promise<number> {
    const options = this.allOptions();
    return totpTimeUsed(options.epoch, options.step);
  }

  public async keyuri(
    accountName: string,
    issuer: string,
    secret: SecretKey
  ): Promise<string> {
    return totpKeyuri<T>(accountName, issuer, secret, this.allOptions());
  }
}
