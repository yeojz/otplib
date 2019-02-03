import * as core from 'otplib-core';
import { resetObjectMocks } from 'tests/helpers';
import decodeKey from './decodeKey';
import token from './token';

jest.mock('otplib-core');
jest.mock('./decodeKey', () => jest.fn());

describe('token', () => {
  beforeEach(() => {
    resetObjectMocks(core);
  });

  it('should return expected result', () => {
    decodeKey.mockImplementation(() => 10);
    core.totpToken.mockImplementation(() => 'result');

    const options = { test: 1 };

    token('test', options);

    expect(decodeKey).toHaveBeenCalledTimes(1);
    expect(decodeKey).toHaveBeenCalledWith('test');

    expect(core.totpToken).toHaveBeenCalledTimes(1);
    expect(core.totpToken).toHaveBeenCalledWith(10, options);
  });
});
