import {expect} from 'chai';
import {stub} from 'sinon';
import decodeKey from 'src/impl/authenticator/decodeKey';

describe('impl/authenticator/decodeKey', function () {
  it('should return expected result', function () {
    const toString = stub();
    const decode = stub().returns(toString);

    decodeKey.__Rewire__('base32', {decode});
    decodeKey('test', 'hex');

    expect(decode.calledWith('test'));
    expect(toString.calledWith('hex'));

    decodeKey.__ResetDependency__('base32');
  });
});
