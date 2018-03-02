import hotpSecret from './hotpSecret';

describe('hotpSecret', function () {
  it('should throw an error when options is undefined', function () {
    expect(() => hotpSecret('hello', {})).toThrow(Error);
  });

  it('should throw an error when options.encoding is undefined', function () {
    expect(() => hotpSecret('hello', {})).toThrowError('Expecting options.encoding to be a string');
  });
});
