import {expect} from 'chai';
import {spy} from 'sinon';
import OTPUtils from 'src/classes/OTPUtils';

describe('classes/OTPUtils', function () {

  [
    'hexToInt',
    'intToHex',
    'isSameToken',
    'pad',
    'removeSpaces',
    'generateSecret',
    'setsOf',
    'stringToHex',
  ].forEach((key) => {
    it(`[${key}] should contain expected static method interface`, function () {
      const fn = () => OTPUtils[key];
      expect(fn).to.not.throw(Error)
      expect(fn).to.be.a('function');
    });
  });

  [
    ['hexToInt', 'hexToInt'],
    ['intToHex', 'intToHex'],
    ['isSameToken', 'isSameToken'],
    ['pad', 'leftPad'],
    ['removeSpaces', 'removeSpaces'],
    ['generateSecret', 'secretKey'],
    ['setsOf', 'setsOf'],
    ['stringToHex', 'stringToHex']
  ].forEach(([methodName, moduleName]) => {
    it(`[${methodName}] should passthrough arguments to it the corresponding util fn`, function () {
      const passthrough = spy();
      OTPUtils.__Rewire__(moduleName, passthrough);
      OTPUtils[methodName]('a1', 'a2', 'a3');
      OTPUtils.__ResetDependency__(moduleName);

      expect(passthrough.calledWith('a1', 'a2', 'a3'));
    });
  });
});
