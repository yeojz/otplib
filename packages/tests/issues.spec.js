import Authenticator from 'otplib-authenticator';
import crypto from 'crypto';

describe('issues', () => {
  test('#7.1', () => {
    const secret = 'xbja vgc6 gv4i i4qq h5ct 6stz ytcp ksiz'.replace(/ /g, '');
    const auth = new Authenticator.Authenticator();

    auth.options = {
      crypto,
      epoch: 1507953809
    };

    const result = auth.generate(secret);

    expect(result).toBe('849140');
  });

  test('#7.2', () => {
    const secret = 'SVT52XEZE2TWC2MU';
    const auth = new Authenticator.Authenticator();

    auth.options = {
      crypto,
      epoch: 1507908269
    };

    const result = auth.generate(secret);

    expect(result).toBe('334156');
  });
});
