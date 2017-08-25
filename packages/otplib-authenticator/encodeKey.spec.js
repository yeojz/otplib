import encodeKey from './encodeKey';

describe('encodeKey', function () {
  it('should return expected encoded key', function () {
    const result = encodeKey('1234567890');
    const expected = 'GEZDGNBVGY3TQOJQ';

    expect(result).toEqual(expected);
  });

  it('should not have equal sign in the result', function () {
    const result = encodeKey('1234567890123');
    const expected = 'GEZDGNBVGY3TQOJQGEZDG===';

    expect(result).toHaveLength(expected.length - 3);
    expect(result).toEqual(result.replace(/=/g, ''));
  });
});
