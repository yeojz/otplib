import stringToHex from './stringToHex';

describe('stringToHex', function () {
  it('should convert string to hex', function () {
    expect(stringToHex('this is a test')).toEqual('7468697320697320612074657374');
    expect(stringToHex('10012')).toEqual('3130303132');
  });

  it('should handle null inputs', function () {
    expect(stringToHex(void 0)).toEqual('');
    expect(stringToHex(null)).toEqual('');
  });
});
