import { authenticator as authenticatorDefault } from '@otplib/preset-default';
import { authenticator as authenticatorAsync } from '@otplib/preset-default-async';
import { authenticator as authenticatorBrowser } from '@otplib/preset-browser';

function runTestIssue7(name, authenticator) {
  test(`[${name}] sample 1`, async () => {
    authenticator.resetOptions();
    const secret = 'xbja vgc6 gv4i i4qq h5ct 6stz ytcp ksiz'.replace(/ /g, '');

    authenticator.options = { epoch: 1507953809 * 1000 };
    const result = await authenticator.generate(secret);

    expect(result).toBe('849140');
  });

  test(`[${name}] sample 2`, async () => {
    authenticator.resetOptions();
    const secret = 'SVT52XEZE2TWC2MU';

    authenticator.options = { epoch: 1507908269 * 1000 };
    const result = await authenticator.generate(secret);

    expect(result).toBe('334156');
  });
}

runTestIssue7('preset-default', authenticatorDefault);
runTestIssue7('preset-default-async', authenticatorAsync);
runTestIssue7('preset-browser', authenticatorBrowser);
