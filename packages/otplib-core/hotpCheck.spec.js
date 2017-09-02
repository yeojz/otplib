import crypto from 'crypto';
import hotpCheck from './hotpCheck';

describe('hotpCheck', function () {
  const secret = 'i6im0gc96j0mn00c';
  const token = '229021';

  it('should throw an error when option is null', function () {
    expect(() => hotpCheck(token, secret, 0, null)).toThrow(Error);
  });

  it('should throw an error when option is undefined', function () {
    expect(() => hotpCheck(token, secret, 0, void 0)).toThrow(Error);
  });

  it('should return false when counter is null', function () {
    expect(hotpCheck(token, secret, null, {crypto})).toBe(false);
  });

  it('should return false when counter is undefined', function () {
    expect(hotpCheck(token, secret, void 0, {crypto})).toBe(false);
  });

  [
    ['i6im0gc96j0mn00c', 3, '229021'],
    ['i6im0gc96j0mn00c', 47412420, '196182'],
    ['65jh84eo38k32edm', 47412423, '963234'],
    ['f4515l6ob3gkganp', 47412433, '415572'],
    ['2o9989k76ij7eh9c', 47412435, '343659']
  ].forEach((entry, idx) => {
    const [setSecret, setCounter, setToken] = entry;

    it(`${idx} should return true `, function () {
      expect(hotpCheck(setToken, setSecret, setCounter, {crypto})).toBe(true);
    });
  });
});
