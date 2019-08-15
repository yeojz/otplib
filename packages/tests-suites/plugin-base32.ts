import { KeyEncodings, KeyDecoder, KeyEncoder } from 'otplib-core';

interface TestKeys {
  encoded: string;
  decoded: string;
}

interface Base32Plugin {
  keyDecoder: KeyDecoder;
  keyEncoder: KeyEncoder;
}

const testKeys: TestKeys[] = [
  {
    encoded: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    decoded: '68442f372b67474e2f47617679706f6e30756f51'
  },
  {
    encoded: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
    decoded: '636c6c4e506479436f314f6b4852623167564f76'
  },
  {
    encoded: 'IFCWS4SRN5FEOUJTOJRXAUKBKRVTA4SB',
    decoded: '41456972516f4a4751337263705141546b307241'
  },
  {
    encoded: 'JFYFCSJSJNMXCOJTGJGVISDMNY3VEV2M',
    decoded: '49705149324b59713933324d54486c6e3752574c'
  },
  {
    encoded: 'JJQXGMCDOI2HS6KTF44E66KQPBRHQOLO',
    decoded: '4a6173304372347979532f384f7950786278396e'
  }
];

export function base32PluginTestSuite(
  name: string,
  plugin: Base32Plugin
): void {
  describe(`${name}`, (): void => {
    testKeys.forEach((entry): void => {
      test(`given encoded key ${entry.encoded}, should receive decoded key ${entry.decoded}`, (): void => {
        expect(plugin.keyDecoder(entry.encoded, KeyEncodings.HEX)).toBe(
          entry.decoded
        );
      });

      test(`given decoded key ${entry.decoded}, should receive encoded key ${entry.encoded}`, (): void => {
        expect(plugin.keyEncoder(entry.decoded, KeyEncodings.HEX)).toBe(
          entry.encoded
        );
      });
    });
  });
}
