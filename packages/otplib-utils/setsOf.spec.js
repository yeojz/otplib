import setsOf from './setsOf';

describe('setsOf', function () {
  it('should break into sets of 4 by default', function () {
    expect(setsOf('123a223b333c')).toBe('123a 223b 333c');
  });

  it('should break into specified sets', function () {
    expect(setsOf('123a223b333c', 2)).toBe('12 3a 22 3b 33 3c');
  });

  it('should break into specified sets with specified divider', function () {
    expect(setsOf('123a223b333c', 2, '-')).toBe('12-3a-22-3b-33-3c');
  });

  it('should handle string values', function () {
    expect(setsOf(null)).toBe('');
    expect(setsOf(void 0)).toBe('');
    expect(setsOf(1234)).toBe('');
  });

  it('should handle non-integer divisor by returning empty string', function () {
    expect(setsOf('123a223b333c', null)).toBe('');
    expect(setsOf('123a223b333c', 'abcd')).toBe('');
  });
});
