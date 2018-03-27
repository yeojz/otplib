import otplib from 'otplib';
import rfc4226 from './rfc4226';

describe('RFC 4226 - integration', () => {
  rfc4226.tokens.forEach((token, counter) => {
    test(`[${counter}] otplib.hotp`, () => {
      expect(otplib.hotp.check(token, rfc4226.secret, counter)).toBe(true);
    });
  });
});
