/* eslint-disable @typescript-eslint/ban-ts-ignore */
import {
  KeyEncodings,
  CreateRandomBytes,
  CreateDigest,
  hotpCreateHmacKey,
  hotpCounter,
  HashAlgorithms
} from '@otplib/core';
import * as rfc4226 from '@tests/data/rfc-4226';

const { secret, digests } = rfc4226;

interface CryptoPlugin {
  createDigest: CreateDigest | CreateDigest<Promise<string>>;
  createRandomBytes: CreateRandomBytes | CreateRandomBytes<Promise<string>>;
}

export function testSuiteCryptoPlugin(
  name: string,
  plugin: CryptoPlugin
): void {
  describe(`(${name}) createDigest`, (): void => {
    digests.forEach((digest: string, counter: number): void => {
      test(`given counter (${counter}), should recieve expected digest`, async (): Promise<
        void
      > => {
        const result = await plugin.createDigest(
          HashAlgorithms.SHA1,
          hotpCreateHmacKey(HashAlgorithms.SHA1, secret, KeyEncodings.ASCII),
          hotpCounter(counter)
        );

        expect(result).toBe(digest);
      });
    });

    test('given an invalid algorithm, createDigest should throw', async (): Promise<
      void
    > => {
      let error;
      try {
        await plugin.createDigest(
          // @ts-ignore
          'oops',
          hotpCreateHmacKey(HashAlgorithms.SHA1, secret, KeyEncodings.ASCII),
          hotpCounter(1000)
        );
      } catch (err) {
        error = err;
      }

      expect(error).not.toBeUndefined();
    });
  });

  describe(`(${name}) createRandomBytes`, (): void => {
    // 10 bytes * 8 = 80 bits
    // 80 / 4 = 20 for hex encoded;
    [10, 20, 30, 60].forEach((size): void => {
      const hexSize = (size * 8) / 4;
      test(`create byte size of ${size} with hex size of ${hexSize}`, async (): Promise<
        void
      > => {
        const result = await plugin.createRandomBytes(size, KeyEncodings.HEX);
        expect(result.length).toBe(hexSize);
      });
    });
  });
}
