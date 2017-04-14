import {expect} from 'chai';
import {spy, stub} from 'sinon';
import check from 'src/impl/authenticator/check';

describe('impl/authenticator/check', function () {
  it('should return expected result', function () {
    const totpCheck = spy();
    const decodeKey = stub().returns(10);
    const options = {
      test: 1
    };

    check.__Rewire__('totpCheck', totpCheck);
    check.__Rewire__('decodeKey', decodeKey);

    check('test1', 'test2');

    check.__ResetDependency__('totpCheck');
    check.__ResetDependency__('decodeKey');

    expect(decodeKey.calledWith('test2', 'binary'));
    expect(totpCheck.calledWith('test1', 10, options));
  });
});
