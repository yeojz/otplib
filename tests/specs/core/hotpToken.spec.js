import {expect} from 'chai';
import hotpToken from 'src/core/hotpToken';

describe('core/hotpToken', function () {

  it('should return empty string when counter is null or undefined', function () {
    expect(hotpToken('i6im0gc96j0mn00c')).to.equal('');
    expect(hotpToken('i6im0gc96j0mn00c', void 0)).to.equal('');
    expect(hotpToken('i6im0gc96j0mn00c', null)).to.equal('');
  });

  it('should return correct tokens', function () {
    [
      ['i6im0gc96j0mn00c', 3, '229021'],
      ['i6im0gc96j0mn00c', 47412420, '196182'],
      ['65jh84eo38k32edm', 47412423, '963234'],
      ['f4515l6ob3gkganp', 47412433, '415572'],
      ['2o9989k76ij7eh9c', 47412435, '343659']
    ].forEach(([secret, counter, expected]) => {
      const token = hotpToken(secret, counter);
      expect(token).to.equal(expected);
    })
  });

  it('should return tokens with 8 digits', function () {
    const token = hotpToken('i6im0gc96j0mn00c', 3, {
      digits: 8
    });
    expect(token).to.equal('12229021');
  });

  it('should return correct tokens with hex secret', function () {
    const token = hotpToken('6936696d30676339366a306d6e303063', 3, {
      encoding: 'hex'
    });
    expect(token).to.equal('229021');
  });

  it('should return correct tokens with base64 secret', function () {
    const token = hotpToken('aTZpbTBnYzk2ajBtbjAwYw==', 3, {
      encoding: 'base64'
    });
    expect(token).to.equal('229021');
  });
});
