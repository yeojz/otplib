import crypto from 'crypto';
import secretKey from './secretKey';

describe('secretKey', () => {
  const noCrypto = 'Expecting options.crypto to have a randomBytes function';

  it('returns empty string when length is null', () => {
    expect(secretKey(null)).toBe('');
  });

  it('returns empty string when length is undefined', () => {
    expect(secretKey(void 0)).toBe('');
  });

  it('returns empty string when length is less than 1', () => {
    expect(secretKey(0)).toBe('');
  });

  it('throws error when no crypto module found', () => {
    expect(() => secretKey(16)).toThrowError(noCrypto);
  });

  it('throws error when no randomBytes function in crypto module found', () => {
    expect(() => secretKey(16, { crypto: {} })).toThrowError(noCrypto);
  });

  it('returns key with expected length', () => {
    expect(secretKey(16, { crypto })).toHaveLength(16);
  });
});
