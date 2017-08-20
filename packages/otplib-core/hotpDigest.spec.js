import hotpDigest from './hotpDigest';

describe('hotpDigest', function () {

  const secret = 'test';
  const counter = 0;

  it('should throw an error if options is null', function () {
    expect(() => hotpDigest(secret, counter, null)).toThrow(Error);
  });

  it('should throw an error if options is undefined', function () {
    expect(() => hotpDigest(secret, counter)).toThrow(Error);
  });

  it('should throw an error if options is not an object', function () {
    expect(() => hotpDigest(secret, counter, 'notObject')).toThrow(Error);
  });

  it('should throw an error if options.crypto is not defined', function () {
    expect(() => hotpDigest(secret, counter, {})).toThrow(Error);
  });

  it('should throw an error if options.crypto does not have a createHmac function', function () {
    expect(() => hotpDigest(secret, counter, {crypto: {}})).toThrow(Error);
  });
});
