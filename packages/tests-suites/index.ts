import { HOTP, TOTP, KeyEncodings } from 'otplib-core';
import { Authenticator } from 'otplib-authenticator';
import { issuesTestSuite } from './issues';
import { hotpTestSuite, totpTestSuite } from './rfcs';

export { base32TestSuite } from './endec';

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
    const { createRandomBytes } = pkg.authenticator.allOptions();

    sizes.forEach((size): void => {
      const hexSize = (size * 8) / 4;
      test(`byte ${size}, hex size: ${hexSize}`, (): void => {
        const result = createRandomBytes(size, KeyEncodings.HEX);
        expect(result.length).toBe(hexSize);
      });
    });
  });
}

interface AuthenticatorTestCase {
  decoded: string;
  digest: string;
  secret: string;
  epoch: number;
  token: string;
}

export const AUTHENTICATOR_DATASET: AuthenticatorTestCase[] = [
  {
    decoded: '68442f372b67474e2f47617679706f6e30756f51',
    digest: '422eb1a849cf0650fef4dbdd8b0ee0fe57a87eb9',
    epoch: 1565103854545,
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    token: '566155'
  },
  {
    decoded: '68442f372b67474e2f47617679706f6e30756f51',
    digest: 'c305b82dbf2a8d2d8a22e9d3992e4e666222d0e2',
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    epoch: 1565103878581,
    token: '522154'
  },
  {
    decoded: '636c6c4e506479436f314f6b4852623167564f76',
    digest: '64a959e511420af1a406424f87b4412977b3cbd4',
    secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
    epoch: 1565103903110,
    token: '540849'
  }
];
