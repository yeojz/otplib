import totp from './index';
import TOTP from './TOTP';

describe('index', function () {
  it('should expose hotp class', function () {
    expect(totp.TOTP).toEqual(TOTP);
  });

  it('should expose an instance of HOTP', function () {
    expect(totp).toBeInstanceOf(TOTP);
  });
});
