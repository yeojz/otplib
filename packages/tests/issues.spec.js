
import Authenticator from 'otplib-authenticator';
import crypto from 'crypto';

describe('issues', function () {

  function getOptions(epoch) {
    return {
      crypto,
      epoch,
      encoding: 'hex',
    }
  }

  test('#7.1', function () {
    const secret = 'xbja vgc6 gv4i i4qq h5ct 6stz ytcp ksiz'.replace(/\ /g, '');
    const result = Authenticator.utils.token(secret, getOptions(1507953809));
    expect(result).toBe('849140');
  })

  test('#7.2', function () {
    const secret = 'SVT52XEZE2TWC2MU';
    const result = Authenticator.utils.token(secret, getOptions(1507908269));
    expect(result).toBe('334156');
  });
});
