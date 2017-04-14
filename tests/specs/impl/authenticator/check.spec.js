import {expect} from 'chai';
import {spy, stub} from 'sinon';
import check from 'src/impl/authenticator/check';

describe('impl/authenticator/check', function () {
  it('should return expected result', function () {
    const values = rewire();

    check('test1', 'test2', {});

    reset();

    expect(values.decodeKey.calledWith('test2', 'binary'));
    expect(values.totpCheck.calledWith('test1', 10, values.options));
  });

  [
    ['null', null],
    ['undefined', void 0]
  ].forEach((entry, idx) => {
    it(`[${idx}] should return result`, function () {
      const values = rewire();
      check('test1', 'test2', entry[1]);
      reset();
      expect(values.decodeKey.calledWith('test2', 'binary'));
      expect(values.totpCheck.calledWith('test1', 10, values.options));
    });
  });

  function rewire() {
    const totpCheck = spy();
    const decodeKey = stub().returns(10);
    const options = {
      test: 1
    };

    check.__Rewire__('totpCheck', totpCheck);
    check.__Rewire__('decodeKey', decodeKey);

    return {
      decodeKey,
      options,
      totpCheck
    }
  }

  function reset() {
    check.__ResetDependency__('totpCheck');
    check.__ResetDependency__('decodeKey');
  }
});
