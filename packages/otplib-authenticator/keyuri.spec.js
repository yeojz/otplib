import keyuri from './keyuri';

describe('keyuri', function () {
  [
    ['otpauth://totp/test:me?secret=123&issuer=test', 'me', 'test', '123'],
    ['otpauth://totp/null:null?secret=null&issuer=null', null, null, null],
    ['otpauth://totp/service:user?secret=&issuer=service', void 0, void 0, void 0]
  ].forEach((entry, idx) => {
    const [url, ...args] = entry;

    it(`[${idx}] should generate expected values`, function () {
      const result = keyuri(...args);
      expect(result).toBe(url);
    });
  });
});
