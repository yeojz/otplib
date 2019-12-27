/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { Authenticator } from '@otplib/core';
import { AuthenticatorAsync } from '@otplib/core-async';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';

function issue7Test(
  name: string,
  authenticator: Authenticator | AuthenticatorAsync
): void {
  describe(`(${name}) issue #7`, (): void => {
    beforeEach((): void => {
      authenticator.resetOptions();
    });

    test('sample 1', async (): Promise<void> => {
      const secret = 'xbja vgc6 gv4i i4qq h5ct 6stz ytcp ksiz'.replace(
        / /g,
        ''
      );

      authenticator.options = { epoch: 1507953809 * 1000 };
      const result = await authenticator.generate(secret);

      expect(result).toBe('849140');
    });

    test('sample 2', async (): Promise<void> => {
      const secret = 'SVT52XEZE2TWC2MU';

      authenticator.options = { epoch: 1507908269 * 1000 };
      const result = await authenticator.generate(secret);

      expect(result).toBe('334156');
    });
  });
}

function issue136Test(
  name: string,
  authenticator: Authenticator | AuthenticatorAsync
): void {
  describe(`(${name}) issue #136`, (): void => {
    const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
    const code = '123456';
    const { createDigest } = authenticator.allOptions();

    test('problem', async (): Promise<void> => {
      expect.assertions(1);

      const instance = authenticator.create();

      // @ts-ignore
      instance.options = {
        createDigest,
        keyEncoder,
        keyDecoder
      };

      try {
        await instance.check(code, secret);
        instance.resetOptions();
        await instance.check(code, secret);
      } catch (err) {
        expect(err).not.toBeUndefined();
      }
    });

    test('fix', async (): Promise<void> => {
      expect.assertions(0);

      // @ts-ignore
      const instance = authenticator.create({
        createDigest,
        keyEncoder,
        keyDecoder
      });

      try {
        await instance.check(code, secret);
        instance.resetOptions();
        await instance.check(code, secret);
      } catch (err) {
        expect(err).toBeUndefined();
      }
    });
  });
}

export function testSuiteIssues(
  name: string,
  authenticator: Authenticator | AuthenticatorAsync
): void {
  issue7Test(name, authenticator);
  issue136Test(name, authenticator);
}
