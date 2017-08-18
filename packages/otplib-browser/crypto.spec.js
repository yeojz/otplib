import crypto from './crypto';

describe('crypto', function () {
  test('should expose an object with a used method', function () {
    expect(typeof crypto).toEqual('object')
    expect(typeof crypto.createHmac).toEqual('function');
    expect(typeof crypto.randomBytes).toEqual('function');
  });
});
