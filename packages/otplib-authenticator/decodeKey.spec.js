import decodeKey from './decodeKey';

describe('decodeKey', function () {
  it('should return expected decoded key', function () {
    const result = decodeKey('GEZDGNBVGY3TQOJQGEZDG');
    expect(result).toBe('31323334353637383930313233');
  });
});
