import { Authenticator } from 'otplib-authenticator';
import { keyDecoder, keyEncoder } from 'otplib-plugin-thirty-two';

export interface IssuesTestSuiteOptions {
  authenticator: Authenticator;
}

export function issuesTestSuite(
  name: string,
  opt: IssuesTestSuiteOptions
): void {
  const { authenticator } = opt;
  const { createDigest } = authenticator.allOptions();

  describe(`(${name}) issues`, (): void => {
    describe('#7', (): void => {
      beforeEach((): void => {
        authenticator.resetOptions();
      });

      test('sample 1', (): void => {
        const secret = 'xbja vgc6 gv4i i4qq h5ct 6stz ytcp ksiz'.replace(
          / /g,
          ''
        );

        authenticator.options = { epoch: 1507953809 * 1000 };
        const result = authenticator.generate(secret);

        expect(result).toBe('849140');
      });

      test('sample 2', (): void => {
        const secret = 'SVT52XEZE2TWC2MU';

        authenticator.options = { epoch: 1507908269 * 1000 };
        const result = authenticator.generate(secret);

        expect(result).toBe('334156');
      });
    });

    describe('#136', (): void => {
      const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
      const code = '123456';

      test('problem', (): void => {
        const problem = new Authenticator();

        problem.options = {
          createDigest,
          keyEncoder,
          keyDecoder
        };

        expect((): void => {
          problem.check(code, secret);
        }).not.toThrow();

        problem.resetOptions();

        expect((): void => {
          problem.check(code, secret);
        }).toThrow();
      });

      test('fix', (): void => {
        expect((): void => {
          authenticator.check(code, secret);
        }).not.toThrow();

        authenticator.resetOptions();

        expect((): void => {
          authenticator.check(code, secret);
        }).not.toThrow();
      });
    });
  });
}
