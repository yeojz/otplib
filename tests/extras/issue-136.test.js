import { Authenticator as AuthenticatorDefault } from '@otplib/core';
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';

const secret = 'KVKFKRCPNZQUYMLXOVYDSQKJKZDTSRLD';
const code = '123456';

function runTestIssue136(name, Authenticator) {
  const authenticator = new Authenticator();

  test(`#136 - [${name}] option is reset if set via options setter`, async () => {
    expect.assertions(1);

    const instance = authenticator.create();

    instance.options = {
      createDigest,
      createRandomBytes,
      keyEncoder,
      keyDecoder
    };

    try {
      await instance.check(code, secret);
      instance.resetOptions();
      await instance.check(code, secret);
    } catch (err) {
      expect(err).not.toBeUndefined();
    }
  });

  test(`#136 - [${name}] allow setting of persistent options via constructor / create`, async () => {
    expect.assertions(0);

    // @ts-ignore
    const instance = authenticator.create({
      createDigest,
      createRandomBytes,
      keyEncoder,
      keyDecoder
    });

    try {
      await instance.check(code, secret);
      instance.resetOptions();
      await instance.check(code, secret);
    } catch (err) {
      expect(err).toBeUndefined();
    }
  });
}

runTestIssue136('Authenticator', AuthenticatorDefault);
