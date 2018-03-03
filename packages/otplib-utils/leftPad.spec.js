import leftPad from './leftPad';

describe('leftPad', () => {
  it('should pad a value by length', () => {
    expect(leftPad('1', 5)).toBe('00001');
  });

  it('should pad gracefully return with invalid length', () => {
    expect(leftPad('1', null)).toBe('1');
    expect(leftPad('1', void 0)).toBe('1');
    expect(leftPad('1', -1)).toBe('1');
  });
});
