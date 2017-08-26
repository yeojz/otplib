import crypto from './crypto';

describe('crypto', function () {
  test('should expose an object with a used method', function () {
    expect(typeof crypto).toBe('object')
    expect(typeof crypto.createHmac).toBe('function');
    expect(typeof crypto.randomBytes).toBe('function');
  });
});
