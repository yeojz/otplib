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

  it('should return false on any null values', () => {
    expect(isSameToken(null, null)).toBe(false);
    expect(isSameToken(null, '123')).toBe(false);
    expect(isSameToken('123', null)).toBe(false);
  });

  it('#94 - should return false when comparing string with integer start and integer', () => {
    expect(isSameToken('1234abc', 1234)).toBe(false);
    expect(isSameToken(1234, '1234abc')).toBe(false);
  });
});
