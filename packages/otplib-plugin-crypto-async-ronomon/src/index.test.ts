/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { HashAlgorithms } from '@otplib/core';
import { testSuiteCryptoPlugin } from 'tests/suite/plugin-crypto';
// @ts-ignore
import cryptoAsync from '@ronomon/crypto-async';
import * as plugin from './index';

testSuiteCryptoPlugin('plugin-crypto-async-ronomon', plugin);

test('throws when something goes wrong', async (): Promise<void> => {
  expect.assertions(1);

  try {
    // @ts-ignore
    await plugin.createDigest('somethingelse', 'test', 'something');
  } catch (err) {
    expect(err).not.toBeUndefined();
  }
});

test('if error is thrown, async is rejected', async (): Promise<void> => {
  expect.assertions(1);

  const hmac = jest.spyOn(cryptoAsync, 'hmac');
  hmac.mockImplementation((...args: unknown[]): void => {
    const callback = args[args.length - 1] as (...args: unknown[]) => void;
    callback('rejected');
  });

  try {
    await plugin.createDigest(HashAlgorithms.SHA1, 'test', 'something');
  } catch (err) {
    expect(err).toEqual('rejected');
  }
});
