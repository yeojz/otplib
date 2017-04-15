import {expect} from 'chai';
import {stub} from 'sinon';
import randomBytes from 'src/utils/randomBytes';

describe('utils/randomBytes', function () {

  let prevWindow;

  beforeEach(function () {
    prevWindow = global.window;
    global.window = {}
  });

  afterEach(function () {
    global.window = prevWindow;
  });

  it('should throw when window is not available', function () {
    global.window = void 0;
    expect(() => randomBytes(10)).to.throw(Error);
  });

  [
    'crytpo',
    'msCrypto'
  ].forEach((crypt) => {

    it(`[${crypt}] should throw when size is too big`, function () {
      stubCrypto(crypt, () => {});
      expect(() => randomBytes(65537)).to.throw(Error);
    });

    it(`[${crypt}] should throw when size is < 1`, function () {
      stubCrypto(crypt, () => {});
      expect(() => randomBytes(0)).to.throw(Error);
    });
  });

  it('should return a buffer', function () {
    const crypto = stub();
    stubCrypto('crypto', crypto);

    const result = randomBytes(4);
    expect(crypto.getCall(0).args[0]).to.be.instanceOf(Uint8Array);
    expect(result).to.be.instanceOf(Buffer);
    expect(result).to.have.length(4);
  });


  function stubCrypto(key, obj) {
    global.window[key] = {
      getRandomValues: obj
    }
  }
});
