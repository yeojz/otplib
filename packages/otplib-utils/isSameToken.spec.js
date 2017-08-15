import isSameToken from './isSameToken';

describe('isSameToken', function () {
  it('should return true when are same integer', function () {
    expect(isSameToken(10, 10)).toBe(true);
  });

  it('should return true when are same integer strings', function () {
    expect(isSameToken('10', '10')).toBe(true);
  });

  it('should return true even when one is an integer string', function () {
    expect(isSameToken(10, '10')).toBe(true);
  });

  it('should return false when both are same non-integer strings', function () {
    expect(isSameToken('test', 'test')).toBe(false);
  });

  it('should compare properly when not base10', function () {
    expect(isSameToken(10.0, 10.1)).toBe(false);
    expect(isSameToken(10.1, 10.1)).toBe(true);
    expect(isSameToken('10.0', '10.1')).toBe(false);
  });
});
