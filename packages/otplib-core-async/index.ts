/**
 * Provides async methods and classes
 * in addition to the normal otplib-core methods and classes
 */
export * from 'otplib-core';
export * from 'otplib-hotp-async';
export * from 'otplib-totp-async';
export * from 'otplib-authenticator-async';

/**
 * Generates Class Placeholders which redirect users
 * to Async exports.
 *
 * @ignore
 */
function useAsyncClassOnly(className: string): { new (): void } {
  return class {
    public constructor() {
      throw new Error(
        `You are importing from ${className} from the *-async package.` +
          ` Please replace your ${className} import with ${className}Async instead.`
      );
    }
  };
}

export const HOTP = useAsyncClassOnly('HOTP');
export const TOTP = useAsyncClassOnly('TOTP');
export const Authenticator = useAsyncClassOnly('Authenticator');
