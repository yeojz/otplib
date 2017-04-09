import {expect} from 'chai';
import {stub} from 'sinon';
import totpToken from 'src/core/totpToken';

describe('core/totpToken', function () {

  it('should return correct tokens', function () {
    const stubbed = rewire();
    const token = totpToken('i6im0gc96j0mn00c', {
      epoch: 60
    });

    reset();

    expect(stubbed.counter.calledWith(60000, 30)).to.be.true;
    expect(token).to.equal('923066');
  });

  it('should return result even if options is null', function () {
    rewire();
    const token = totpToken('i6im0gc96j0mn00c', null);
    reset();

    expect(token).to.equal('923066');
  });

  it('should return result even if options is void 0', function () {
    rewire();
    const token = totpToken('i6im0gc96j0mn00c', void 0);
    reset();

    expect(token).to.equal('923066');
  });

  function rewire() {
    const counter = stub().returns(3);
    totpToken.__Rewire__('totpCounter', counter);

    return {
      counter
    };
  }

  function reset() {
    totpToken.__ResetDependency__('totpCounter');
  }
});
