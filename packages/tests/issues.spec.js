import authenticator from 'otplib-authenticator';
import crypto from 'crypto';

describe('issues', () => {
  describe('#7', () => {
    function runIssue7Test(secret, epoch, code) {
      const auth = new authenticator.Authenticator();

      auth.options = {
        crypto,
        epoch
      };

      const result = auth.generate(secret);
      expect(result).toBe(code);
    }

    test('sample 1', () => {
      const secret = 'xbja vgc6 gv4i i4qq h5ct 6stz ytcp ksiz'.replace(
        / /g,
        ''
      );
      runIssue7Test(secret, 1507953809, '849140');
    });

    test('sample 2', () => {
      const secret = 'SVT52XEZE2TWC2MU';
      runIssue7Test(secret, 1507908269, '334156');
    });
  });

  describe('#136', () => {
    const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
    const code = '123456';
    let auth;

    beforeEach(() => {
      auth = new authenticator.Authenticator();
    });

    test('problem', () => {
      auth.options = {
        crypto
      };

      expect(() => auth.check(code, secret)).not.toThrow();
      auth.resetOptions();
      expect(() => auth.check(code, secret)).toThrow();
    });

    test('fix', () => {
      auth.defaultOptions = {
        crypto
      };

      expect(() => auth.check(code, secret)).not.toThrow();
      auth.resetOptions();
      expect(() => auth.check(code, secret)).not.toThrow();
    });
  });
});
