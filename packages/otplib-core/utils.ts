export enum HashAlgorithms {
  'SHA1' = 'sha1',
  'SHA256' = 'sha256',
  'SHA512' = 'sha512'
}
export const HASH_ALGORITHMS = Object.values(HashAlgorithms);

export enum KeyEncodings {
  'ASCII' = 'ascii',
  'BASE64' = 'base64',
  'HEX' = 'hex',
  'LATIN1' = 'latin1',
  'UTF8' = 'utf8'
}
export const KEY_ENCODINGS = Object.values(KeyEncodings);

export enum Strategy {
  'HOTP' = 'hotp',
  'TOTP' = 'totp'
}
export const STRATEGY = Object.values(Strategy);

export type HexString = string;

export interface KeyURIOptions {
  algorithm?: HashAlgorithms;
  counter?: number;
  digits?: number;
  issuer?: string;
  label: string;
  secret: string;
  step?: number;
  type: Strategy;
  user: string;
}

export function isTokenValid(value: string): boolean {
  return /^(\d+)(\.\d+)?$/.test(value);
}

export function keyuri(options: KeyURIOptions): string {
  const tmpl = `otpauth://${options.type}/{label}:{user}?secret={secret}{query}`;
  const params: string[] = [];

  if (STRATEGY.indexOf(options.type) < 0) {
    throw new Error(
      `Expecting options.type to be one of ${STRATEGY.join(', ')}. Received ${
        options.type
      }.`
    );
  }

  if (options.type === 'hotp') {
    if (options.counter == null || typeof options.counter !== 'number') {
      throw new Error(
        'Expecting options.counter to be a number when options.type is "hotp".'
      );
    }

    params.push(`&counter=${options.counter}`);
  }

  if (options.type === 'totp' && options.step) {
    params.push(`&period=${options.step}`);
  }

  if (options.digits) {
    params.push(`&digits=${options.digits}`);
  }

  if (options.algorithm) {
    params.push(`&algorithm=${options.algorithm.toUpperCase()}`);
  }

  if (options.issuer) {
    params.push(`&issuer=${encodeURIComponent(options.issuer)}`);
  }

  return tmpl
    .replace('{user}', encodeURIComponent(options.user))
    .replace('{secret}', options.secret)
    .replace('{label}', encodeURIComponent(options.label))
    .replace('{query}', params.join(''));
}
