import totp from './index';
import TOTP from './TOTP';

describe('index', () => {
  it('should expose hotp class', () => {
    expect(totp.TOTP).toEqual(TOTP);
  });

  it('should expose an instance of HOTP', () => {
    expect(totp).toBeInstanceOf(TOTP);
  });
});
