import {
  CreateHmacKey,
  HOTP,
  HOTPOptions,
  hotpOptionsValidator,
  hotpToken
} from './hotp';
import {
  HASH_ALGORITHMS,
  HashAlgorithms,
  HexString,
  KeyEncodings,
  Strategy,
  isTokenValid,
  keyuri,
  KeyURIOptions
} from './utils';

export interface TOTPOptions extends HOTPOptions {
  epoch: number;
  step: number;
  window: number | [number, number];
}

export function totpOptionsValidator(options: Partial<TOTPOptions>): void {
  hotpOptionsValidator(options);

  if (typeof options.epoch !== 'number') {
    throw new Error('Expecting options.epoch to be a number.');
  }

  if (typeof options.step !== 'number') {
    throw new Error('Expecting options.step to be a number.');
  }
}

export function totpCounter(epoch: number, step: number): number {
  return Math.floor(epoch / step / 1000);
}

export function totpToken(secret: string, options: TOTPOptions): string {
  const counter = totpCounter(options.epoch, options.step);
  return hotpToken(secret, counter, options);
}

export function totpCheck(
  token: string,
  secret: string,
  options: TOTPOptions
): boolean {
  if (!isTokenValid(token)) {
    return false;
  }

  const systemToken = totpToken(secret, options);
  return token === systemToken;
}

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

export function createTOTPCheckRunner(
  token: string,
  secret: string,
  options: TOTPOptions
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

export function totpCheckWithWindow(
  token: string,
  secret: string,
  options: TOTPOptions
): number | null {
  const bounds = getWindowBounds(options.window);

  if (totpCheck(token, secret, options)) {
    return 0;
  }

  const totpCheckRunner = createTOTPCheckRunner(token, secret, options);
  const backward = totpCheckRunner(-1, bounds[0]);
  return backward !== null ? backward : totpCheckRunner(1, bounds[1]);
}

export function totpTimeUsed(epoch: number, step: number): number {
  return Math.floor(epoch / 1000) % step;
}

export function totpTimeRemaining(epoch: number, step: number): number {
  return step - totpTimeUsed(epoch, step);
}

export const totpPadSecret = (
  secret: Buffer,
  currentSize: number,
  targetSize: number
): HexString => {
  const hexSecret = secret.toString('hex');

  if (currentSize < targetSize) {
    const newSecret = new Array(targetSize - currentSize + 1).join(hexSecret);
    return Buffer.from(newSecret, 'hex')
      .slice(0, targetSize)
      .toString('hex');
  }

  return hexSecret;
};

export const totpCreateHmacKey: CreateHmacKey = (
  algorithm: HashAlgorithms,
  secret: string,
  encoding: KeyEncodings
): HexString => {
  const encoded = Buffer.from(secret, encoding);
  const len = secret.length;

  switch (algorithm) {
    case HashAlgorithms.SHA1:
      return totpPadSecret(encoded, len, 20);
    case HashAlgorithms.SHA256:
      return totpPadSecret(encoded, len, 32);
    case HashAlgorithms.SHA512:
      return totpPadSecret(encoded, len, 64);
    default:
      throw new Error(
        `Expecting algorithm to be one of ${HASH_ALGORITHMS.join(
          ', '
        )}. Received ${algorithm}.`
      );
  }
};

export function totpOptions(opt: Partial<TOTPOptions>): TOTPOptions {
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

export class TOTP<T extends TOTPOptions = TOTPOptions> extends HOTP<T> {
  public finalOptions(): T {
    return totpOptions(this.options) as T;
  }

  public generate(secret: string): string {
    return totpToken(secret, this.finalOptions());
  }

  public check(token: string, secret: string): boolean {
    const delta = this.checkDelta(token, secret);
    return typeof delta === 'number';
  }

  public verify(opts: { token: string; secret: string }): boolean {
    return this.check(opts.token, opts.secret);
  }

  public checkDelta(token: string, secret: string): number | null {
    return totpCheckWithWindow(token, secret, this.finalOptions());
  }

  public timeRemaining(): number {
    const options = this.finalOptions();
    return totpTimeRemaining(options.epoch, options.step);
  }

  public timeUsed(): number {
    const options = this.finalOptions();
    return totpTimeUsed(options.epoch, options.step);
  }

  public keyuri(
    user: string,
    label: string,
    secret: string,
    params?: Pick<KeyURIOptions, 'issuer'>
  ): string {
    const options = this.finalOptions();

    return keyuri({
      ...params,
      algorithm: options.algorithm,
      digits: options.digits,
      step: options.step,
      type: Strategy.TOTP,
      label,
      secret,
      user
    });
  }
}
