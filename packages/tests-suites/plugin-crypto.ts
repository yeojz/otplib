import * as rfc4226 from 'tests-data/rfc4226';
import {
  KeyEncodings,
  CreateRandomBytes,
  CreateDigest,
  hotpCreateHmacKey,
  hotpCounter,
  HashAlgorithms
} from 'otplib-core';

const { secret, digests } = rfc4226;

interface CryptoPlugin {
  createDigest: CreateDigest;
  createRandomBytes: CreateRandomBytes;
}

export function cryptoPluginTestSuite(
  name: string,
  plugin: CryptoPlugin
): void {
  describe(`${name}`, (): void => {
    digests.forEach((digest: string, counter: number): void => {
      test(`given counter (${counter}), should recieve expected digest`, (): void => {
        const result = plugin.createDigest(
          HashAlgorithms.SHA1,
          hotpCreateHmacKey(HashAlgorithms.SHA1, secret, KeyEncodings.ASCII),
          hotpCounter(counter)
        );

        expect(result).toBe(digest);
      });
    });

    test('should create random bytes of expected length', (): void => {
      // 10 bytes * 8 = 80 bits
      // 80 / 4 = 20 for hex encoded;
      const result = plugin.createRandomBytes(10, KeyEncodings.HEX);
      expect(result.length).toBe(20);
    });
  });
}
