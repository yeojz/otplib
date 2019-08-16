import { Authenticator, TOTP, HOTP, KeyEncodings } from 'otplib-core';
import { hotpTestSuite, totpTestSuite } from './rfcs';
import { issuesTestSuite } from './issues';

interface Presets {
  hotp: HOTP;
  totp: TOTP;
  authenticator: Authenticator;
}

interface AuthenticatorSuiteTestCase {
  epoch: number;
  secret: string;
  token: string;
}

const tokenSets: AuthenticatorSuiteTestCase[] = [
  {
    epoch: 1565103854545,
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    token: '566155'
  },
  {
    epoch: 1565103903110,
    secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
    token: '540849'
  },
  {
    epoch: 1565106003151,
    secret: 'IM4G6QTIONHS63SRKRBEU4LEIRSTIQTM',
    token: '668733'
  },
  {
    epoch: 1565106018408,
    secret: 'PIZGURTBIZ2EU4SNGFKHE5LXKVEFA6CM',
    token: '767234'
  },
  {
    epoch: 1565106407848,
    secret: 'LA2XU3LZO53SWWJVKFVFU3TGIQZEU3SF',
    token: '942732'
  },
  {
    epoch: 1565106431089,
    secret: 'PE4U4RBVMJFE6V2VOBEGINLKMJ3G4LZZ',
    token: '235413'
  },
  {
    epoch: 1565106483557,
    secret: 'I5JUGURXO5TTGVRUGBBUGU2TNZMVSVTP',
    token: '508543'
  }
];

export function presetTestSuite(name: string, pkg: Presets): void {
  hotpTestSuite(name, {
    hotp: pkg.hotp
  });

  totpTestSuite(name, {
    totp: pkg.totp
  });

  issuesTestSuite(name, {
    authenticator: pkg.authenticator
  });

  describe(`${name} - Authenticator`, (): void => {
    const { authenticator } = pkg;

    beforeEach((): void => {
      authenticator.resetOptions();
    });

    tokenSets.forEach((entry): void => {
      test(`given epoch (${entry.epoch}) and secret, should receive expected token ${entry.token}`, (): void => {
        authenticator.options = {
          epoch: entry.epoch
        };

        expect(authenticator.generate(entry.secret)).toBe(entry.token);
      });
    });

    describe('given a epoch and window, a set of tokens should return the correct validation window', (): void => {
      const secret = 'J44DMWLUIFHE63SQKR4FKODQKB2UWZCT';
      const epoch = 1565973031233;
      const deltaSets: [string, number | null][] = [
        ['039223', -2],
        ['311336', -1],
        ['288367', 0],
        ['408608', 1],
        ['721767', 2],
        ['819412', null]
      ];

      deltaSets.forEach(([token, delta]): void => {
        test(`given window (2), token (${token}), should return delta (${delta})`, (): void => {
          authenticator.options = {
            epoch,
            window: 2
          };

          expect(authenticator.checkDelta(token, secret)).toEqual(delta);
        });

        test(`given window ([2, 2]), token (${token}), should return delta (${delta})`, (): void => {
          authenticator.options = {
            epoch,
            window: [2, 2]
          };

          expect(authenticator.checkDelta(token, secret)).toEqual(delta);
        });
      });
    });
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
