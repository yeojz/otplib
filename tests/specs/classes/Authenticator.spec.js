import {expect} from 'chai';
import {spy} from 'sinon';
import Authenticator from 'src/classes/Authenticator';

describe('classes/Authenticator', function() {

  let otp;

  beforeEach(function () {
    otp = new Authenticator();
  });

  it('should contain expected method interfaces', function () {
    [
      'generate',
      'check',
      'keyuri',
      'encode',
      'decode',
      'generateSecret'
    ].forEach((key) => {
      const fn = () => otp[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });

  it('should passthrough arguments to it the corresponding fn', function () {
    [
      ['encode', 'encodeKey'],
      ['decode', 'decodeKey'],
      ['keyuri', 'keyuri'],
      ['generateSecret', 'secretKey'],
    ].forEach(([methodName, moduleName]) => {
      const passthrough = spy();
      Authenticator.__Rewire__(moduleName, passthrough);
      otp[methodName]('a1', 'a2', 'a3');
      Authenticator.__ResetDependency__(moduleName);

      expect(passthrough.calledWith('a1', 'a2', 'a3'));
    });
  });

  it('[options] should init with values', function () {
    expect(Object.keys(otp.options)).to.have.length.gt(0);
  });

  it('[generate] should call token function with options', function () {
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
});
