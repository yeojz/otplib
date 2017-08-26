import removeSpaces from './removeSpaces';

describe('removeSpaces', function () {
  const val = ' a   ';

  it('should strip spaces', function () {
    expect(val).not.toBe('a');
    expect(removeSpaces(val)).toBe('a');
  });

  it('should return empty string', function () {
    expect(removeSpaces()).toBe('');
    expect(removeSpaces(null)).toBe('');
    expect(removeSpaces(void 0)).toBe('');
  });
});
