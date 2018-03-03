import intToHex from './intToHex';

describe('intToHex', () => {
  it('should convert integer to hex', () => {
    expect(intToHex(1000)).toBe('3e8');
  });
});
