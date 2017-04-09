import {expect} from 'chai';
import {spy, stub} from 'sinon';
import TOTP from 'src/classes/TOTP';

describe('classes/TOTP', function () {
  let otp;
  const defaultOptionLength = 6;

  beforeEach(() => {
    otp = new TOTP();
  });

  it('should contain expected method interfaces', function () {
    [
      'generate',
      'check',
      'verify'
    ].forEach((key) => {
      const fn = () => otp[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });

  it('[options] should init with values', function () {
    expect(Object.keys(otp.options)).to.have.length.gt(0);
  });

  it('[options] sets and gets correctly', function () {
    expect(Object.keys(otp.options)).to.have.length(defaultOptionLength);

    otp.options = {
      digits: 8,
      epoch: 10,
      extra: 'test',
    }

    expect(Object.keys(otp.options)).to.have.length(defaultOptionLength + 1);
    expect(otp.options.digits).to.equal(8);
    expect(otp.options.epoch).to.equal(10);
    expect(otp.options.extra).to.not.be.undefined;
  });

  it('[generate] returns correct token', function () {
    otp.options = {
      epoch: 90
    }
    const result = otp.generate('i6im0gc96j0mn00c');
    expect(result).to.be.eql('229021');
  });

  it('[check] passes arguments to totpCheck with defined options', function () {
    const options = {
      extra: Math.floor(Math.random() * 100)
    }
    const totpCheck = spy();
    TOTP.__Rewire__('totpCheck', totpCheck);

    otp.options = options;
    otp.check('token', 'secret');

    TOTP.__ResetDependency__('totpCheck');
    const args = totpCheck.getCall(0).args;

    expect(args[0]).to.equal('token');
    expect(args[1]).to.equal('secret');
    expect(args[2]).to.be.an.object;
    expect(args[2].extra).to.equal(options.extra);
  });

  it('[verify] should be an alias of check with object as parameter', function () {
    const check = spy();
    stub(otp, 'check').callsFake(check);

    otp.verify({
      token: 'token',
      secret: 'secret'
    });

    otp.check.restore();

    const args = check.getCall(0).args;
    expect(args[0]).to.equal('token');
    expect(args[1]).to.equal('secret');
  });

  it('[verify] returns false when non-object or null is passed in', function () {
    expect(otp.verify(null)).to.be.false;
    expect(otp.verify(() => 1)).to.be.false;
    expect(otp.verify(void 0)).to.be.false;
  });
});
