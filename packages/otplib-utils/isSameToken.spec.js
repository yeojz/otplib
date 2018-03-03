import isSameToken from './isSameToken';

describe('isSameToken', () => {
  it('should return true when are same integer', () => {
    expect(isSameToken(10, 10)).toBe(true);
  });

  it('should return true when are same integer strings', () => {
    expect(isSameToken('10', '10')).toBe(true);
  });

  it('should return true even when one is an integer string', () => {
    expect(isSameToken(10, '10')).toBe(true);
  });

  it('should return false when both are same non-integer strings', () => {
    expect(isSameToken('test', 'test')).toBe(false);
  });

  it('should compare properly when not base10', () => {
    expect(isSameToken(10.0, 10.1)).toBe(false);
    expect(isSameToken(10.1, 10.1)).toBe(true);
    expect(isSameToken('10.0', '10.1')).toBe(false);
  });
});
