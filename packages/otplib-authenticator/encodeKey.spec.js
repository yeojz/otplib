import encodeKey from './encodeKey';

describe('encodeKey', () => {
  it('should return expected encoded key', () => {
    const result = encodeKey('1234567890');
    expect(result).toBe('GEZDGNBVGY3TQOJQ');
  });

  it('should not have equal sign in the result', () => {
    const result = encodeKey('1234567890123');
    const expected = 'GEZDGNBVGY3TQOJQGEZDG===';

    expect(result).toHaveLength(expected.length - 3);
    expect(result).toBe(result.replace(/=/g, ''));
  });
});
