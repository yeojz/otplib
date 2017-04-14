import {expect} from 'chai';
import {spy, stub} from 'sinon';
import Authenticator from 'src/classes/Authenticator';

describe('classes/Authenticator', function () {

  let otp;

  beforeEach(function () {
    otp = new Authenticator();
  });

  [
    'generate',
    'check',
    'keyuri',
    'encode',
    'decode',
    'generateSecret',
    'check'
  ].forEach((key) => {
    it(`[${key}] should contain expected method interface`, function () {
      const fn = () => otp[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });

  [
    ['encode', 'encodeKey'],
    ['decode', 'decodeKey'],
    ['keyuri', 'keyuri']
  ].forEach(([methodName, moduleName]) => {
    it(`[${methodName}] should passthrough arguments to imported function in static methods`, function () {
      const passthrough = spy();
      Authenticator.__Rewire__(moduleName, passthrough);
      otp[methodName]('a1', 'a2', 'a3');
      Authenticator.__ResetDependency__(moduleName);

      expect(passthrough.calledWith('a1', 'a2', 'a3')).to.be.true;
    });
  });

  it('[generateSecret] should return encoded secret', function () {
    const secretKey = stub().returns(11);
    const encodeKey = spy();
    Authenticator.__Rewire__('encodeKey', encodeKey);
    Authenticator.__Rewire__('secretKey', secretKey);
    otp.generateSecret();
    Authenticator.__ResetDependency__('secretKey', spy());
    Authenticator.__ResetDependency__('encodeKey');

    expect(secretKey.calledWith(20)).to.be.true;
    expect(encodeKey.calledWith(11)).to.be.true;
  });

  it('[generateSecret] return empty with null', function () {
    expect(otp.generateSecret(null)).to.equal('');
  });

  it('[generateSecret] return key of correct length', function () {
    const encodeKey = spy();
    Authenticator.__Rewire__('encodeKey', encodeKey);
    otp.generateSecret(30);
    Authenticator.__ResetDependency__('encodeKey');

    expect(encodeKey.args[0][0]).to.have.length(30)
  });

  it('[options] should init with values', function () {
    expect(Object.keys(otp.options)).to.have.length.gt(0);
  });

  it('[generate] should call imported token function with options', function () {
    const token = spy();
    const opts = otp.options;

    Authenticator.__Rewire__('token', token);
    otp.generate('test');
    Authenticator.__ResetDependency__('token');

    const args = token.getCall(0).args;
    expect(args[0]).to.equal('test');
    expect(args[1]).to.be.an.object;
    expect(args[1]).to.deep.equal(opts);
  });

  it('[check] should call imported check function with options', function () {
    const check = spy();
    const opts = otp.options;

    Authenticator.__Rewire__('check', check);
    otp.check('token', 'secret');
    Authenticator.__ResetDependency__('check');

    const args = check.getCall(0).args;
    expect(args[0]).to.equal('token');
    expect(args[1]).to.equal('secret');
    expect(args[2]).to.be.an.object;
    expect(args[2]).to.deep.equal(opts);
  });
});
