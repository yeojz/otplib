import {expect} from 'chai';
import hotpCheck from 'src/core/hotpCheck';

describe('core/hotpCheck', function () {
  it('should return true', function () {
    [
      ['i6im0gc96j0mn00c', 3, '229021'],
      ['i6im0gc96j0mn00c', 47412420, '196182'],
      ['65jh84eo38k32edm', 47412423, '963234'],
      ['f4515l6ob3gkganp', 47412433, '415572'],
      ['2o9989k76ij7eh9c', 47412435, '343659']
    ].forEach(([secret, counter, expected]) => {
      expect(hotpCheck(expected, secret, counter)).to.be.true;
    });
  });

  it('shoudl default counter to 0 when undefined', function () {
    expect(hotpCheck('847856', 'i6im0gc96j0mn00c')).to.be.true;
  });

  it('should return false when invalid counter', function () {
    expect(hotpCheck('229021', 'i6im0gc96j0mn00c', null)).to.be.false;
  });
});
