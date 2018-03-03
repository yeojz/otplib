import decodeKey from './decodeKey';

describe('decodeKey', () => {
  it('should return expected decoded key', () => {
    const result = decodeKey('GEZDGNBVGY3TQOJQGEZDG');
    expect(result).toBe('31323334353637383930313233');
  });
});
