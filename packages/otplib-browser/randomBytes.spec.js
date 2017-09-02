/* eslint-disable no-global-assign */
import randomBytes from './randomBytes';

describe('randomBytes', function () {
  const noCrypto = 'Unable to load crypto module. You may be on an older browser';
  const tooLarge = 'Requested size of random bytes is too large';
  const wrongSize = 'Requested size must be more than 0';

  it('throws error when crypto is not available', function () {
    expect(() => randomBytes(10)).toThrowError(noCrypto);
  });

  [
    'msCrypto',
    'crypto'
  ].forEach((name) => {
    const prev = global.window[name];

    it(`[${name}] should return a buffer`, function () {
      const stub = getCrypto();

      global.window[name] = stub;
      const result = randomBytes(10);

      expect(stub.getRandomValues.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
      expect(result).toBeInstanceOf(Buffer);
      expect(result).toHaveLength(10);
    });

    it(`[${name}] should throw when size is too big`, function () {
      global.window[name] = getCrypto();
      expect(() => randomBytes(65537)).toThrowError(tooLarge);
    });

    it(`[${name}] should throw when size is < 1`, function () {
      global.window[name] = getCrypto();
      expect(() => randomBytes(0)).toThrowError(wrongSize);
    });

    global.window[name] = prev;
  });


  function getCrypto() {
    return {
      getRandomValues: jest.fn()
    };
  }
});
