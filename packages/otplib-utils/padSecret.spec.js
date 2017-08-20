import padSecret from './padSecret';

describe('padSecret', function () {

  const secret = new Buffer('hello');

  it('should have length 20', function () {
    const result = padSecret(secret, 20);
    expect(result.length).toEqual(20);
  });

  it('should have length 32', function () {
    const result = padSecret(secret, 32);
    expect(result.length).toEqual(32);
  });

  it('should have length 64', function () {
    const result = padSecret(secret, 64);
    expect(result.length).toEqual(64);
  });

  it('should not pad when length already exceeded', function () {
    const result = padSecret(secret, 2);
    expect(result.length).toEqual(secret.length);
  });
});
