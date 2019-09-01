import { authenticator } from 'otplib-preset-default';
import { createDigest } from 'otplib-plugin-crypto-async-ronomon';
import { authenticatorDigestAsync } from 'otplib-core-async';
import { table as authenticatorTable } from 'tests-data/authenticator';

test('Async Support - Async over Sync methods', async () => {
  const sample = authenticatorTable[0];
  const instance = authenticator.clone();

  const digest = await authenticatorDigestAsync(sample.secret, {
    ...instance.allOptions(),
    createDigest,
    epoch: sample.epoch // this is not in the example.
  });

  instance.options = { digest };
  const token = instance.generate(sample.secret);

  // make sure you reset to remove the digest.
  instance.resetOptions();

  expect(token).toEqual(sample.token);
});
