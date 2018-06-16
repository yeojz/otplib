import totpTimeUsed from './totpTimeUsed';

describe('totpTimeUsed', () => {
  const time_30_00 = 1529154660000;
  const time_30_10 = 1529154640000;

  it('should return 0 ', () => {
    expect(totpTimeUsed(time_30_00, 30)).toBe(0);
  });

  it('should return 10 ', () => {
    expect(totpTimeUsed(time_30_10, 30)).toBe(10);
  });

  it('should not return 0 ', () => {
    expect(totpTimeUsed(time_30_00, 18)).toBe(12);
  });
});
