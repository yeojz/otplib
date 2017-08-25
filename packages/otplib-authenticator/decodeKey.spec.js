import decodeKey from './decodeKey';

describe('decodeKey', function () {
  it('should return expected decoded key', function () {
    const result = decodeKey('GEZDGNBVGY3TQOJQGEZDG');
    const expected = '31323334353637383930313233';

    expect(result).toEqual(expected);
  });
});
