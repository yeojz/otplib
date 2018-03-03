import totpCounter from './totpCounter';

describe('totpCounter', () => {
  it('should return expected counter values', () => {
    expect(totpCounter(60000, 30)).toEqual(2);
    expect(totpCounter(90000, 30)).toEqual(3);
  });
});
