
import Authenticator from 'otplib-authenticator';
import crypto from 'crypto';

describe('issues', function () {
  test('SVT52XEZE2TWC2MU, ', function () {
    const result = Authenticator.utils.token('SVT52XEZE2TWC2MU', {
      crypto,
      encoding: 'hex',
      epoch: 1507908269,
    });

    expect(result).toBe('334156');
  });
});
