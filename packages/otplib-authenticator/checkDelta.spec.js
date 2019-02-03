import * as core from 'otplib-core';
import { resetObjectMocks } from 'tests/helpers';
import check from './check';
import decodeKey from './decodeKey';

jest.mock('otplib-core');
jest.mock('./decodeKey', () => jest.fn());

describe('checkDelta', () => {
  beforeEach(() => {
    resetObjectMocks(core);
  });

  it('should call and return value from totpToken', () => {
    const token = '123456';
    const secret = 'GEZDGNBVGY3TQOJQGEZDG';
    const options = { test: 'test' };

    core.totpCheckWithWindow.mockImplementation(() => jest.fn());

    decodeKey.mockImplementation(() => 'decode');

    check(token, secret, options);

    expect(decodeKey).toHaveBeenCalledTimes(1);
    expect(decodeKey).toHaveBeenCalledWith('GEZDGNBVGY3TQOJQGEZDG');

    expect(core.totpCheckWithWindow).toHaveBeenCalledTimes(1);
    expect(core.totpCheckWithWindow).toHaveBeenCalledWith(
      token,
      'decode',
      options
    );
  });
});
