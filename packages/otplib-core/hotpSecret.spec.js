import hotpSecret from './hotpSecret';

describe('hotpSecret', () => {
  it('should throw an error when options is undefined', () => {
    expect(() => hotpSecret('hello', {})).toThrow(Error);
  });

  it('should throw an error when options.encoding is undefined', () => {
    expect(() => hotpSecret('hello', {})).toThrowError(
      'Expecting options.encoding to be a string'
    );
  });
});
