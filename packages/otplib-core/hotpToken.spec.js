import crypto from 'crypto';
import hotpToken from './hotpToken';
import hotpSecret from './hotpSecret';

describe('hotpToken', () => {
  const secret = 'i6im0gc96j0mn00c';
  const options = {
    algorithm: 'sha1',
    createHmacSecret: hotpSecret,
    crypto,
    digits: 6,
    encoding: 'ascii'
  };

  it('should throw an error when option is null', () => {
    expect(() => hotpToken(secret, 3, null)).toThrow(Error);
  });

  it('should throw an error when option is undefined', () => {
    expect(() => hotpToken(secret, 3, void 0)).toThrow(Error);
  });

  it('should throw an error when option.digits is undefined', () => {
    expect(() => hotpToken(secret, 3, {})).toThrowError(
      'Expecting options.digits to be a number'
    );
  });
  it(`should return empty string when counter is null`, () => {
    expect(hotpToken(secret, null, options)).toBe('');
  });

  it(`should return empty string when counter is void 0`, () => {
    expect(hotpToken(secret, void 0, options)).toBe('');
  });

  it('should return tokens with 8 digits', () => {
    const token = hotpToken(
      secret,
      3,
      Object.assign({}, options, { digits: 8 })
    );
    expect(token).toBe('12229021');
  });

  it('should return correct tokens with hex secret', () => {
    const token = hotpToken(
      '6936696d30676339366a306d6e303063',
      3,
      Object.assign({}, options, { encoding: 'hex' })
    );
    expect(token).toBe('229021');
  });

  it('should return correct tokens with base64 secret', () => {
    const token = hotpToken(
      'aTZpbTBnYzk2ajBtbjAwYw==',
      3,
      Object.assign({}, options, { encoding: 'base64' })
    );
    expect(token).toBe('229021');
  });

  [
    ['i6im0gc96j0mn00c', 3, '229021'],
    ['i6im0gc96j0mn00c', 47412420, '196182'],
    ['65jh84eo38k32edm', 47412423, '963234'],
    ['f4515l6ob3gkganp', 47412433, '415572'],
    ['2o9989k76ij7eh9c', 47412435, '343659']
  ].forEach((entry, idx) => {
    const [setSecret, setCounter, setToken] = entry;

    it(`[${idx}] should return correct tokens`, () => {
      const token = hotpToken(setSecret, setCounter, options);
      expect(token).toBe(setToken);
    });
  });
});
