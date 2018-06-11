type CreateHmacSecretFunction = (secret: string, options: any) => Buffer;

interface HOTPOptions {
  algorithm?: string;
  createHmacSecret?: CreateHmacSecretFunction;
  crypto?: any;
  digits?: number;
  encoding?: string;
}

interface HOTPVerifyOptions {
  token?: string;
  secret?: string;
  counter?: number;
}

interface TOTPOptions extends HOTPOptions {
  epoch?: any;
  step?: number;
  window?: number | number[];
}

interface TOTPVerifyOptions {
  token?: string;
  secret?: string;
}

declare class HOTP {
  HOTP: typeof HOTP;
  getClass(): typeof HOTP;

  options: HOTPOptions;
  optionsAll: HOTPOptions;
  resetOptions(): this;
  generate(secret: string, counter: number): string;
  check(token: string, secret: string, counter: number): boolean;
  verify(opts: HOTPVerifyOptions): boolean;
}

declare class TOTP extends HOTP {
  TOTP: typeof TOTP;
  getClass(): typeof TOTP;

  options: TOTPOptions;
  optionsAll: TOTPOptions;
  generate(secret: string): string;
  check(token: string, secret: string): boolean;
  checkDelta(token: string, secret: string): number | null;
  verify(opts: TOTPVerifyOptions): boolean;
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
