/**
 * Secret Key used for OTP generation
 */
export type SecretKey = string;

/**
 * Algorithms that are used for
 * calculating the HMAC value
 */
export enum HashAlgorithms {
  'SHA1' = 'sha1',
  'SHA256' = 'sha256',
  'SHA512' = 'sha512'
}

/**
 * The encoding format for the [[SecretKey]].
 * This is mostly used for converting the
 * provided secret into a Buffer.
 */
export enum KeyEncodings {
  'ASCII' = 'ascii',
  'BASE64' = 'base64',
  'HEX' = 'hex',
  'LATIN1' = 'latin1',
  'UTF8' = 'utf8'
}

/**
 * The OTP generation strategies.
 * Either HMAC or Time based.
 */
export enum Strategy {
  'HOTP' = 'hotp',
  'TOTP' = 'totp'
}

/**
 * A hex encoded string.
 */
export type HexString = string;

export interface KeyURIOptions {
  accountName: string;
  algorithm?: HashAlgorithms;
  counter?: number;
  digits?: number;
  issuer?: string;
  label?: string;
  secret: SecretKey;
  step?: number;
  type: Strategy;
}

/**
 * Checks if a string contains a valid token format.
 */
export function isTokenValid(value: string): boolean {
  return /^(\d+)$/.test(value);
}

/**
 * Returns an array of values of the enumerable properties of an object.
 * This is used in place of Object.values for wider platform support.
 *
 * @param value Object that contains the properties and methods.
 */
export function objectValues<T>(value: T): string[] {
  return Object.keys(value).map(
    (key): string => (value[key as keyof T] as unknown) as string
  );
}

/**
 * Left pad the current string with a given string to a given length.
 *
 * This behaves similarly to String.prototype.padStart
 *
 * @param value The string to pad.
 * @param maxLength The length of the resulting string once the current string has been padded.
 *  If this parameter is smaller than the current string's length, the current
 *  string will be returned as it is.
 * @param fillString The string to pad the current string with.
 */
export function padStart(
  value: string,
  maxLength: number,
  fillString: string
): string {
  if (value.length >= maxLength) {
    return value;
  }

  const padding = Array(maxLength + 1).join(fillString);
  const padded = `${padding}${value}`;
  return padded.slice(padded.length - maxLength);
}

const STRATEGY = objectValues<typeof Strategy>(Strategy);

/**
 * Generates an otpauth uri which can be used in a QR Code.
 *
 * Reference: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
 *
 * Sample Output: otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example
 *
 * **Example**
 *
 * ```js
 * import qrcode from 'qrcode';
 *
 * const otpauth = keyuri({ ... })
 *
 * qrcode.toDataURL(otpauth, (err, imageUrl) => {
 *   if (err) {
 *     console.log('Error with QR');
 *     return;
 *   }
 *   console.log(imageUrl);
 * });
 * ```
 */
export function keyuri(options: KeyURIOptions): string {
  const tmpl = `otpauth://${options.type}/{labelPrefix}:{accountName}?secret={secret}{query}`;
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
    .replace(
      '{labelPrefix}',
      encodeURIComponent(options.issuer || options.accountName)
    )
    .replace('{accountName}', encodeURIComponent(options.accountName))
    .replace('{secret}', options.secret)
    .replace('{query}', params.join(''));
}
