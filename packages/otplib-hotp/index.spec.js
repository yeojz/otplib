import hotp from './index';
import HOTP from './HOTP';

describe('index', () => {
  it('should expose hotp class', () => {
    expect(hotp.HOTP).toEqual(HOTP);
  });

  it('should expose an instance of HOTP', () => {
    expect(hotp).toBeInstanceOf(HOTP);
  });
});
