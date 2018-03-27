import otplib from 'otplib';
import rfc6238 from './rfc6238';

describe('RFC 6238 - integration', () => {
  rfc6238.table.forEach(row => {
    const id = `${row.algorithm} / ${row.epoch}`;
    test(`[${id}] otplib.totp`, () => {
      otplib.totp.options = {
        epoch: row.epoch,
        algorithm: row.algorithm,
        digits: 8
      };

      expect(otplib.totp.check(row.token, rfc6238.secret)).toBe(true);
    });
  });
});
