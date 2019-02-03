import keyuri from './keyuri';

describe('keyuri', () => {
  [
    ['otpauth://totp/test:me?secret=123&issuer=test', 'me', 'test', '123'],
    ['otpauth://totp/null:null?secret=null&issuer=null', null, null, null],
    [
      'otpauth://totp/service:user?secret=&issuer=service',
      void 0,
      void 0,
      void 0
    ],
    [
      'otpauth://totp/test%20got%20space:me%20got%20space?secret=123&issuer=test%20got%20space',
      'me got space',
      'test got space',
      '123'
    ]
  ].forEach((entry, idx) => {
    const [url, ...args] = entry;

    it(`[${idx}] should generate expected values`, () => {
      const result = keyuri(...args);
      expect(result).toBe(url);
    });
  });
});
