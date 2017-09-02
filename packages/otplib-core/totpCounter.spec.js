import totpCounter from './totpCounter';

describe('totpCounter', function () {
  it('should return expected counter values', function () {
    expect(totpCounter(60000, 30)).toEqual(2)
    expect(totpCounter(90000, 30)).toEqual(3)
  });
});
