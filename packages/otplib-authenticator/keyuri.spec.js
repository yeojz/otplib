import keyuri from './keyuri';

describe('keyuri', () => {
  const opts = {
    algorithm: 'sha1',
    digits: 6,
    step: 30
  };
  [
    [
      'otpauth://totp/test:me?secret=123&issuer=test&algorithm=sha1&digits=6&period=30',
      'me',
      'test',
      '123',
      opts
    ],
    [
      'otpauth://totp/null:null?secret=null&issuer=null&algorithm=sha1&digits=6&period=30',
      null,
      null,
      null,
      opts
    ],
    [
      'otpauth://totp/test%20got%20space:me%20got%20space?secret=123&issuer=test%20got%20space&algorithm=sha1&digits=6&period=30',
      'me got space',
      'test got space',
      '123',
      opts
    ],
    [
      'otpauth://totp/test:me?secret=123&issuer=test&algorithm=alg&digits=1&period=2',
      'me',
      'test',
      '123',
      {
        algorithm: 'alg',
        digits: 1,
        step: 2
      }
    ]
  ].forEach((entry, idx) => {
    const [url, ...args] = entry;

    it(`[${idx}] should generate expected values`, () => {
      const result = keyuri(...args);
      expect(result).toBe(url);
    });
  });
});
