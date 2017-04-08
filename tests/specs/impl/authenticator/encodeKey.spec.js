import {expect} from 'chai';
import {stub} from 'sinon';
import encodeKey from 'src/impl/authenticator/encodeKey';

describe('impl/authenticator/encodeKey', function () {
  it('should return expected result', function () {
    const toString = stub();
    const encode = stub().returns(toString);

    encodeKey.__Rewire__('base32', {encode});

    encodeKey('test', 'hex');

    encodeKey.__ResetDependency__('base32');

    expect(encode.calledWith('test'));
    expect(toString.calledWith('hex'));

  });
});
