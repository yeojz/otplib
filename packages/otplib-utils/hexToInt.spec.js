import hexToInt from './hexToInt';

describe('hexToInt', function () {
  it('should convert hex to integer', function () {
    expect(hexToInt('3e8')).toEqual(1000);
  });
});
