import {expect} from 'chai';
import {stub} from 'sinon';
import token from 'src/impl/authenticator/token';

describe('impl/authenticator/token', function () {
  it('should return expected result', function () {
    const totpToken = stub();
    const decodeKey = stub().returns(10);
    const options = {
      test: 1
    };

    token.__Rewire__('totpToken', totpToken);
    token.__Rewire__('decodeKey', decodeKey);

    token('test', options);

    token.__ResetDependency__('totpToken');
    token.__ResetDependency__('decodeKey');

    expect(decodeKey.calledWith('test'));
    expect(totpToken.calledWith(10, options));
  });
});
