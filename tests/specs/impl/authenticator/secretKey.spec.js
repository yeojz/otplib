import {expect} from 'chai';
import {stub} from 'sinon';
import secretKey from 'src/impl/authenticator/secretKey';

describe('impl/authenticator/secretKey', function () {

  it('should return expected result', function () {
    const stubbed = rewire();
    const len = 10;
    const key = secretKey(len);
    reset();

    expect(stubbed.encodeKey.calledWith('11111111111111111111'));
    expect(key).to.have.length(len);
  });

  it('should return default length of 16', function () {
    rewire();
    const key = secretKey();
    reset();

    expect(key).to.have.length(16);
  });

  it('should return empty string when argument not integer', function () {
    expect(secretKey(null)).to.equal('');
    expect(secretKey('nothing')).to.equal('');
  });

  function rewire() {
    const secretKeyUtils = stub().returns(11);
    const encodeKey = stub().returns('22222222222222222222');

    secretKey.__Rewire__('secretKeyUtils', secretKeyUtils)
    secretKey.__Rewire__('encodeKey', encodeKey);

    return {
      encodeKey,
      secretKeyUtils
    };
  }

  function reset() {
    secretKey.__ResetDependency__('secretKeyUtils');
    secretKey.__ResetDependency__('encodeKey');
  }
});
