export type CreateHmacSecretFunction = (secret: string, options: any) => Buffer;

export interface HOTPOptions {
  algorithm?: string;
  createHmacSecret?: CreateHmacSecretFunction;
  crypto?: any;
  digits?: number;
  encoding?: string;
}

export interface HOTPVerifyOptions {
  token?: string;
  secret?: string;
  counter?: number;
}

export interface TOTPOptions extends HOTPOptions {
  epoch?: any;
  step?: number;
  window?: number | number[];
}

export interface TOTPVerifyOptions {
  token?: string;
  secret?: string;
}

export class HOTP {
  options: HOTPOptions;
  optionsAll: HOTPOptions;
  resetOptions(): this;
  generate(secret: string, counter: number): string;
  check(token: string, secret: string, counter: number): boolean;
  verify(opts: HOTPVerifyOptions): boolean;
}

export class TOTP extends HOTP {
  options: TOTPOptions;
  optionsAll: TOTPOptions;
  generate(secret: string): string;
  check(token: string, secret: string): boolean;
  checkDelta(token: string, secret: string): number | null;
  verify(opts: TOTPVerifyOptions): boolean;
}

export class Authenticator extends TOTP {
  check(token: string, secret: string): boolean;
  checkDelta(token: string, secret: string): number | null;
  decode(encodedKey: string): string;
  encode(secret: string): string;
  generate(secret: string): string;
  generateSecret(len?: number): string;
  keyuri(user: string, service: string, secret: string): string;
}

declare module 'otplib' {
  type hotp = HOTP;
  type totp = TOTP;
  type authenticator = Authenticator;
}

declare module 'otplib/hotp' {
  export default HOTP;
}

declare module 'otplib/totp' {
  export default TOTP;
}

declare module 'otplib/authenticator' {
  export default Authenticator;
}
