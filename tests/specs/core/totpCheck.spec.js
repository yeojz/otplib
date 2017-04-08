import {expect} from 'chai';
import {stub} from 'sinon';
import totpCheck from 'src/core/totpCheck';

describe('core/totpCheck', function () {
  it('should return true', function () {
    const result = totpCheck('229021', 'i6im0gc96j0mn00c', {
      epoch: 90
    });

    expect(result).to.be.true;
  });

  it('should return false if systemToken is empty', function () {
    totpCheck.__Rewire__('totpToken', () => '');

    const result = totpCheck('229021', 'i6im0gc96j0mn00c', {
      epoch: 90
    });

    totpCheck.__ResetDependency__('totpToken');
    expect(result).to.be.false;
  });

  it('should return false', function () {
    const result = totpCheck('196182', 'i6im0gc96j0mn00c', {
      epoch: 47412
    });

    expect(result).to.be.false;
  });

  it('should return true even if option is void 0', function () {
    const isSameToken = stub().returns(true);
    totpCheck.__Rewire__('isSameToken', isSameToken);

    const result = totpCheck('196182', 'i6im0gc96j0mn00c', void 0);

    totpCheck.__ResetDependency__('isSameToken');

    expect(isSameToken.calledOnce).to.be.true;
    expect(result).to.be.true;
  });

  it('should return true even if option is null', function () {
    const isSameToken = stub().returns(true);
    totpCheck.__Rewire__('isSameToken', isSameToken);

    const result = totpCheck('196182', 'i6im0gc96j0mn00c', null);

    totpCheck.__ResetDependency__('isSameToken');

    expect(isSameToken.calledOnce).to.be.true;
    expect(result).to.be.true;
  });
});
