import hexToInt from './hexToInt';

describe('hexToInt', () => {
  it('should convert hex to integer', () => {
    expect(hexToInt('3e8')).toEqual(1000);
  });
});
