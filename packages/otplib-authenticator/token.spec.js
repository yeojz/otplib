import * as core from 'otplib-core';
import decodeKey from './decodeKey';
import token from './token';

jest.mock('./decodeKey', () => jest.fn());

describe('token', function () {
  it('should return expected result', function () {
    decodeKey.mockImplementation(() => 10);

    const totpToken = jest.spyOn(core, 'totpToken')
      .mockImplementation(() => 'result');

    const options = { test: 1 };

    token('test', options);

    expect(decodeKey).toHaveBeenCalledTimes(1);
    expect(decodeKey).toHaveBeenCalledWith('test');

    expect(totpToken).toHaveBeenCalledTimes(1);
    expect(totpToken).toHaveBeenCalledWith(10, options);
  });
});
