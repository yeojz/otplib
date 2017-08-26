import totpSecret from './totpSecret';

describe('totpSecret', function () {

  it('should have length 20 with sha1', function () {
    const result = totpSecret('hello', {
      encoding: 'ascii',
      algorithm: 'sha1'
    });

    expect(result.length).toBe(20);
  });

  it('should have length 32 with sha256', function () {
    const result = totpSecret('hello', {
      encoding: 'ascii',
      algorithm: 'sha256'
    });

    expect(result.length).toBe(32);
  });

  it('should have length 64 with sha512', function () {
    const result = totpSecret('hello', {
      encoding: 'ascii',
      algorithm: 'sha512'
    });

    expect(result.length).toBe(64);
  });

  it('should encode secret AS-IS when non recognized algorithm found', function () {
    const result = totpSecret('hello', {
      encoding: 'ascii',
      algorithm: 'sha-custom'
    });

    expect(result.length).toBe(5);
  });
});
