import { authenticator } from '@builds/preset-default';
import { createDigest } from '@builds/plugin-crypto-async-ronomon';
import { authenticatorDigestAsync } from '@builds/core-async';
import { table } from '@tests/data/sample-authenticator';

test('Async Support - Async over Sync methods', async () => {
  const sample = table[0];
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
