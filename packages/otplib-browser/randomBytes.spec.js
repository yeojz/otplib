import randomBytes from './randomBytes';

describe('randomBytes', function () {
  let prevWindow = global.window;

  beforeEach(function () {
    global.window = {}
  });

  afterEach(function () {
    global.window = prevWindow;
  });

  it('should throw when window is not available', function () {
    global.window = void 0;
    expect(() => randomBytes(10)).toThrow(Error);
  });

  [
    'crytpo',
    'msCrypto'
  ].forEach((crypt) => {

    it(`[${crypt}] should throw when size is too big`, function () {
      stubCrypto(crypt, () => {});
      expect(() => randomBytes(65537)).toThrow(Error);
    });

    it(`[${crypt}] should throw when size is < 1`, function () {
      stubCrypto(crypt, () => {});
      expect(() => randomBytes(0)).toThrow(Error);
    });
  });

  it('should return a buffer', function () {
    const crypto = jest.fn();
    stubCrypto('crypto', crypto);

    const result = randomBytes(4);

    expect(crypto.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
    expect(result).toBeInstanceOf(Buffer);
    expect(result).toHaveLength(4);
  });

  function stubCrypto(key, obj) {
    global.window[key] = {
      getRandomValues: obj
    }
  }
});
