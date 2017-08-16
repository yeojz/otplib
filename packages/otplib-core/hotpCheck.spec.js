import crypto from 'crypto';
import hotpCheck from './hotpCheck';

describe('hotpCheck', function () {

  [
    null,
    void 0,
  ].forEach((entry) => {
    it(`should throw an error when option is null or undefined`, function () {
      expect(() => hotpCheck('229021', 'i6im0gc96j0mn00c', 0, entry)).toThrow(Error);
    });
  });

  [
    ['i6im0gc96j0mn00c', 3, '229021'],
    ['i6im0gc96j0mn00c', 47412420, '196182'],
    ['65jh84eo38k32edm', 47412423, '963234'],
    ['f4515l6ob3gkganp', 47412433, '415572'],
    ['2o9989k76ij7eh9c', 47412435, '343659']
  ].forEach(([secret, counter, expected]) => {
    it(`should return true `, function () {
      expect(hotpCheck(expected, secret, counter, {crypto})).toBe(true);
    });
  });

  [
    ['null', null],
    ['undefined', void 0]
  ].forEach((entry) => {
    it(`should return false when counter is ${entry[0]}`, function () {
      expect(hotpCheck('229021', 'i6im0gc96j0mn00c', entry[1], {crypto})).toBe(false);
    });
  });
});
