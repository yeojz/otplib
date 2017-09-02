import intToHex from './intToHex';

describe('intToHex', function () {
  it('should convert integer to hex', function () {
    expect(intToHex(1000)).toBe('3e8');
  });
});
