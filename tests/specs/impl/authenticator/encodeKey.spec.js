import {expect} from 'chai';
import {spy, stub} from 'sinon';
import encodeKey from 'src/impl/authenticator/encodeKey';

const codec = [
  ['testing secret key', 'ORSXG5DJNZTSA43FMNZGK5BANNSXS==='],
  ['the quick brown fox', 'ORUGKIDROVUWG2ZAMJZG653OEBTG66A='],
  ['mvomjsunp qwerty', 'NV3G63LKON2W44BAOF3WK4TUPE======'],
  ['abcd efgh ijkl mnop qrstu', 'MFRGGZBAMVTGO2BANFVGW3BANVXG64BAOFZHG5DV']
];

describe('impl/authenticator/encodeKey', function () {
  it('should execute with correct arguments', function () {
    const toString = spy();
    const encode = stub().returns(toString);

    encodeKey.__Rewire__('base32', {encode});

    encodeKey('test', 'hex');

    encodeKey.__ResetDependency__('base32');

    expect(encode.calledWith('test'));
    expect(toString.calledWith('hex'));
  });

  codec.forEach((entry, idx) => {
    it(`[${idx}] should return expected values`, function () {
      expect(encodeKey(entry[0])).to.be.equal(entry[1]);
    });
  });
});
