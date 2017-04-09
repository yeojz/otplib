import {expect} from 'chai';
import index from 'src/utils/index';

describe('utils/index', function () {
  it('should expose utils', function () {
    expect(index.hexToInt).to.be.a.function;
    expect(index.intToHex).to.be.a.function;
    expect(index.isSameToken).to.be.a.function;
    expect(index.leftPad).to.be.a.function;
    expect(index.removeSpaces).to.be.a.function;
    expect(index.secretKey).to.be.a.function;
    expect(index.setsOf).to.be.a.function;
    expect(index.stringToHex).to.be.a.function;
  });
});
