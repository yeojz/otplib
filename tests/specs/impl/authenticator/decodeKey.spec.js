import {expect} from 'chai';
import {spy, stub} from 'sinon';
import decodeKey from 'src/impl/authenticator/decodeKey';

const codec = [
  ['testing secret key', 'ORSXG5DJNZTSA43FMNZGK5BANNSXS'],
  ['the quick brown fox', 'ORUGKIDROVUWG2ZAMJZG653OEBTG66A'],
  ['mvomjsunp qwerty', 'NV3G63LKON2W44BAOF3WK4TUPE'],
  ['abcd efgh ijkl mnop qrstu', 'MFRGGZBAMVTGO2BANFVGW3BANVXG64BAOFZHG5DV']
];

describe('impl/authenticator/decodeKey', function () {
  it('should execute with correct arguments', function () {
    const toString = spy();
    const decode = stub().returns(toString);

    decodeKey.__Rewire__('base32', {decode});

    decodeKey('test');

    decodeKey.__ResetDependency__('base32');

    expect(decode.calledWith('test'));
  });

  it('should return expected values', function () {
    codec.forEach((entry) => {
      expect(decodeKey(entry[1]).toString()).to.be.equal(entry[0]);
    });
  });
});
