interface hmacOptions {
  algorithm?: string;
  encoding?: string;
}

type createHmacSecret = (secret: string, options: hmacOptions) => Buffer;

interface hotpOptionsInterface extends hmacOptions {
  createHmacSecret?: createHmacSecret;
  crypto?: any;
  digits?: number;
}

interface hotpVerifyOptionsInterface {
  token?: string;
  secret?: string;
  counter?: number;
}

type hotpCheck = (
  token: string,
  secret: string,
  counter: number,
  options: hotpOptionsInterface
) => boolean;

type hotpCounter = (counter: number) => string;

type hotpDigest = (
  secret: string,
  counter: number,
  options: hotpOptionsInterface
) => string;

type hotpOptions = (options: any) => hotpOptionsInterface;

type hotpSecret = createHmacSecret;

type hotpToken = (
  secret: string,
  counter: number,
  options: hotpOptionsInterface
) => string;

interface totpOptionsInterface extends hotpOptionsInterface {
  epoch?: any;
  step?: number;
  window?: number | number[];
}

interface totpVerifyOptionsInterface {
  token?: string;
  secret?: string;
}

type totpCheck = (
  token: string,
  secret: string,
  options: totpOptionsInterface
) => boolean;

type totpCheckWithWindow = (
  token: string,
  secret: string,
  options: totpOptionsInterface
) => number | null;

type totpCounter = (epoch: number, step: number) => number;

type totpOptions = (options: any) => totpOptionsInterface;

type totpSecret = createHmacSecret;

type totpTimeRemaining = (epoch: number, step: number) => number;

type totpTimeUsed = (epoch: number, step: number) => number;

type totpToken = (secret: string, options: totpOptionsInterface) => string;

declare class HOTP {
  HOTP: typeof HOTP;
  getClass(): typeof HOTP;

  options: totpOptionsInterface;
  optionsAll: totpOptionsInterface;
  resetOptions(): this;
  generate(secret: string, counter: number): string;
  check(token: string, secret: string, counter: number): boolean;
  verify(opts: hotpVerifyOptionsInterface): boolean;
}

declare class TOTP extends HOTP {
  TOTP: typeof TOTP;
  getClass(): typeof TOTP;

  options: totpOptionsInterface;
  optionsAll: totpOptionsInterface;
  generate(secret: string): string;
  check(token: string, secret: string): boolean;
  checkDelta(token: string, secret: string): number | null;
  verify(opts: totpVerifyOptionsInterface): boolean;
  timeUsed(): number;
  timeRemaining(): number;
}

declare class Authenticator extends TOTP {
  Authenticator: typeof Authenticator;
  getClass(): typeof Authenticator;

  check(token: string, secret: string): boolean;
  checkDelta(token: string, secret: string): number | null;
  decode(encodedKey: string): string;
  encode(secret: string): string;
  generate(secret: string): string;
  generateSecret(len?: number): string;
  keyuri(user: string, service: string, secret: string): string;
}

declare module 'otplib' {
  const authenticator: Authenticator;
  const hotp: HOTP;
  const totp: TOTP;
}

declare module 'otplib/authenticator' {
  const authenticator: Authenticator;
  export = authenticator;
}

declare module 'otplib/totp' {
  const totp: TOTP;
  export = totp;
}

declare module 'otplib/hotp' {
  const hotp: HOTP;
  export = hotp;
}

declare module 'otplib/core' {
  const hotpCheck: hotpCheck;
  const hotpCounter: hotpCounter;
  const hotpDigest: hotpDigest;
  const hotpOptions: hotpOptions;
  const hotpSecret: hotpSecret;
  const hotpToken: hotpToken;
  const totpCheck: totpCheck;
  const totpCheckWithWindow: totpCheckWithWindow;
  const totpCounter: totpCounter;
  const totpOptions: totpOptions;
  const totpSecret: totpSecret;
  const totpTimeRemaining: totpTimeRemaining;
  const totpTimeUsed: totpTimeUsed;
  const totpToken: totpToken;
}
