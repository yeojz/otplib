import stringToHex from './stringToHex';

describe('stringToHex', function () {
  it('should convert string to hex', function () {
    expect(stringToHex('this is a test')).toBe('7468697320697320612074657374');
    expect(stringToHex('10012')).toBe('3130303132');
  });

  it('should handle null inputs', function () {
    expect(stringToHex(void 0)).toBe('');
    expect(stringToHex(null)).toBe('');
  });
});
