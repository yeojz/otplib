import {expect} from 'chai';
import {spy, stub} from 'sinon';
import HOTP from 'src/classes/HOTP';

describe('classes/HOTP', function () {

  let otp;
  const defaultOptionLength = 0;

  beforeEach(() => {
    otp = new HOTP();
  });

  [
    'generate',
    'check',
    'verify'
  ].forEach((key) => {
    it(`[${key}] should contain expected method interface`, function () {
      const fn = () => otp[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });

  it('[options] sets and gets correctly', function () {
    expect(Object.keys(otp.options)).to.have.length(defaultOptionLength);

    otp.options = {
      digits: 8
    }

    expect(Object.keys(otp.options)).to.have.length(defaultOptionLength + 1);
    expect(otp.options.digits).to.equal(8);
  });

  it('[options] does not error when given value is null', function () {
    const currentOptions = otp.options;
    otp.options = null;
    expect(otp.options).to.deep.equal(currentOptions);
  });

  it('[options] does not error when given value is void 0', function () {
    const currentOptions = otp.options;
    otp.options = void 0;
    expect(otp.options).to.deep.equal(currentOptions);
  });

  it('[check] passes arguments to hotpCheck with defined options', function () {
    const options = {
      extra: Math.floor(Math.random() * 100)
    }
    const hotpCheck = spy();
    HOTP.__Rewire__('hotpCheck', hotpCheck);

    otp.options = options;
    otp.check('token', 'secret', 1);

    HOTP.__ResetDependency__('hotpCheck');
    const args = hotpCheck.getCall(0).args;

    expect(args[0]).to.equal('token');
    expect(args[1]).to.equal('secret');
    expect(args[2]).to.equal(1);
    expect(args[3]).to.be.an.object;
    expect(args[3].extra).to.equal(options.extra);
  });

  [
    ['null', null],
    ['undefined', void 0]
  ].forEach((entry) => {
    it(`[check] returns empty string when counter is ${entry[0]}`, function () {
      expect(otp.check('token', 'secret', entry[1])).to.be.false;
    });
  });

  it('[verify] should be an alias of check with object as parameter', function () {
    const check = spy();
    stub(otp, 'check').callsFake(check);

    otp.verify({
      token: 'token',
      secret: 'secret',
      counter: 1
    });

    otp.check.restore();

    const args = check.getCall(0).args;
    expect(args[0]).to.equal('token');
    expect(args[1]).to.equal('secret');
    expect(args[2]).to.equal(1);
  });

  [
    ['null', null],
    ['undefined', void 0],
    ['a non-object', () => 1]
  ].forEach((entry) => {
    it(`[verify] returns false when argument is ${entry[0]}`, function () {
      expect(otp.verify(entry[1])).to.be.false;
    });
  });
});
