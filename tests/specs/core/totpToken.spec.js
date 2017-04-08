import {expect} from 'chai';
import {stub} from 'sinon';
import totpToken from 'src/core/totpToken';

describe('core/totpToken', function () {
  it('should return floored number', function () {
    const floor = totpToken.__get__('floor');
    expect(floor(1.9)).to.equal(1);
  });

  it('should return correct tokens', function () {
    const stubbed = rewire();
    const token = totpToken('i6im0gc96j0mn00c', {
      epoch: 60000
    });

    reset();

    expect(stubbed.floor.calledWith(2)).to.be.true;
    expect(token).to.equal('229021');
  });

  it('should return result even if options is null', function () {
    rewire();
    const token = totpToken('i6im0gc96j0mn00c', null);
    reset();

    expect(token).to.equal('229021');
  });

  it('should return result even if options is void 0', function () {
    rewire();
    const token = totpToken('i6im0gc96j0mn00c', void 0);
    reset();

    expect(token).to.equal('229021');
  });

  function rewire() {
    const floor = stub().returns(3);
    totpToken.__Rewire__('floor', floor);

    return {
      floor
    }
  }

  function reset() {
    totpToken.__ResetDependency__('floor');
  }
});
