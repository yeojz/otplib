import crypto from 'crypto';
import hotpToken from './hotpToken';

describe('hotpToken', function () {

  [
    null,
    void 0,
  ].forEach((entry) => {
    it(`should throw an error when option is ${entry}`, function () {
      expect(() => hotpToken('i6im0gc96j0mn00c', 3, entry)).toThrow(Error);
    });
  });

  [
    ['null', null],
    ['undefined', void 0]
  ].forEach((entry) => {
    it(`should return empty string when counter is ${entry[0]}`, function () {
      expect(hotpToken('i6im0gc96j0mn00c', entry[1], {crypto})).toEqual('');
    });
  });

  [
    ['i6im0gc96j0mn00c', 3, '229021'],
    ['i6im0gc96j0mn00c', 47412420, '196182'],
    ['65jh84eo38k32edm', 47412423, '963234'],
    ['f4515l6ob3gkganp', 47412433, '415572'],
    ['2o9989k76ij7eh9c', 47412435, '343659']
  ].forEach((entry, idx) => {
    const [secret, counter, expected] = entry;

    it(`[${idx}] should return correct tokens`, function () {
      const token = hotpToken(secret, counter, {crypto});
      expect(token).toEqual(expected);
    });
  });

  it('should return tokens with 8 digits', function () {
    const token = hotpToken('i6im0gc96j0mn00c', 3, {
      crypto,
      digits: 8
    });
    expect(token).toEqual('12229021');
  });

  it('should return correct tokens with hex secret', function () {
    const token = hotpToken('6936696d30676339366a306d6e303063', 3, {
      crypto,
      encoding: 'hex'
    });
    expect(token).toEqual('229021');
  });

  it('should return correct tokens with base64 secret', function () {
    const token = hotpToken('aTZpbTBnYzk2ajBtbjAwYw==', 3, {
      crypto,
      encoding: 'base64'
    });
    expect(token).toEqual('229021');
  });
});
