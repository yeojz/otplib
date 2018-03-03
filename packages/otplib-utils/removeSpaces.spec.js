import removeSpaces from './removeSpaces';

describe('removeSpaces', () => {
  const val = ' a   ';

  it('should strip spaces', () => {
    expect(val).not.toBe('a');
    expect(removeSpaces(val)).toBe('a');
  });

  it('should return empty string', () => {
    expect(removeSpaces()).toBe('');
    expect(removeSpaces(null)).toBe('');
    expect(removeSpaces(void 0)).toBe('');
  });
});
