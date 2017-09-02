import hotp from './index';
import HOTP from './HOTP';

describe('index', function () {
  it('should expose hotp class', function () {
    expect(hotp.HOTP).toEqual(HOTP);
  });

  it('should expose an instance of HOTP', function () {
    expect(hotp).toBeInstanceOf(HOTP);
  });
});
