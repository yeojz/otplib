import { HOTP, TOTP, KeyEncodings } from 'packages/otplib-core';
import { Authenticator } from 'packages/otplib-authenticator';
import { issuesTestSuite } from './issues';
import { hotpTestSuite, totpTestSuite } from './rfcs';

export { base32TestSuite } from './codec';

interface TestPkg {
  hotp: HOTP;
  totp: TOTP;
  authenticator: Authenticator;
}

export function pkgTestSuite(name: string, pkg: TestPkg): void {
  hotpTestSuite(name, {
    hotp: pkg.hotp
  });

  totpTestSuite(name, {
    totp: pkg.totp
  });

  issuesTestSuite(name, {
    authenticator: pkg.authenticator
  });

  describe('createRandomBytes', (): void => {
    const sizes: number[] = [20, 30, 60];
    const { createRandomBytes } = pkg.authenticator.finalOptions();

    sizes.forEach((size): void => {
      const hexSize = (size * 8) / 4;
      test(`byte ${size}, hex size: ${hexSize}`, (): void => {
        const result = createRandomBytes(size, KeyEncodings.HEX);
        expect(result.length).toBe(hexSize);
      });
    });
  });
}
