import totpTimeRemaining from './totpTimeRemaining';

describe('totpTimeRemaining', () => {
  const time_30_00 = 1529154660000;
  const time_30_10 = 1529154640000;

  it('should return 0 ', () => {
    expect(totpTimeRemaining(time_30_00, 30)).toBe(30);
  });

  it('should return 10 ', () => {
    expect(totpTimeRemaining(time_30_10, 30)).toBe(20);
  });

  it('should not return 0 ', () => {
    expect(totpTimeRemaining(time_30_00, 18)).toBe(6);
  });
});
