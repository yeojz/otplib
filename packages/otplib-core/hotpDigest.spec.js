import hotpDigest from './hotpDigest';

describe('hotpDigest', function () {

  const secret = 'test';
  const counter = 0;

  const noOptions = 'Expecting options to be an object';
  const noCrypto = 'Expecting options.crypto to have a createHmac function';

  it('should throw an error if options is null', function () {
    expect(() => hotpDigest(secret, counter, null)).toThrowError(noOptions);
  });

  it('should throw an error if options is undefined', function () {
    expect(() => hotpDigest(secret, counter)).toThrowError(noOptions);
  });

  it('should throw an error if options is not an object', function () {
    expect(() => hotpDigest(secret, counter, 'notObject')).toThrowError(noOptions);
  });

  it('should throw an error if options.crypto is not defined', function () {
    expect(() => hotpDigest(secret, counter, {})).toThrowError(noCrypto);
  });

  it('should throw an error if options.crypto does not have a createHmac function', function () {
    expect(() => hotpDigest(secret, counter, {crypto: {}})).toThrowError(noCrypto);
  });
});
