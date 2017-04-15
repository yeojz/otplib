import {expect} from 'chai';
import keyuri from 'src/impl/authenticator/keyuri';

describe('impl/authenticator/keyuri', function () {
  [
    ['otpauth://totp/test:me?secret=123&issuer=test', 'me', 'test', '123'],
    ['otpauth://totp/null:null?secret=null&issuer=null', null, null, null],
    ['otpauth://totp/service:user?secret=&issuer=service', void 0, void 0, void 0]
  ].forEach((entry, idx) => {
    it(`[${idx}] should generate expected values`, function () {
      const [url, ...args] = entry;
      const result = keyuri(...args);
      expect(result).to.be.equal(url);
    });
  });
});
