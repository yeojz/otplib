import { KeyDecoder, KeyEncoder } from 'otplib-authenticator';
import { KeyEncodings } from 'otplib-core';
import { authenticator } from 'otplib-node';

interface TestKeys {
  encoded: string;
  decoded: string;
}

interface TestPkg {
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

interface AuthenticatorSuiteTestCase {
  epoch: number;
  secret: string;
  token: string;
}

const tokenSets: AuthenticatorSuiteTestCase[] = [
  {
    epoch: 1565103854545,
    secret: 'NBCC6NZLM5DU4L2HMF3HS4DPNYYHK32R',
    token: '566155'
  },
  {
    epoch: 1565103903110,
    secret: 'MNWGYTSQMR4UG3ZRJ5VUQUTCGFTVMT3W',
    token: '540849'
  },
  {
    epoch: 1565106003151,
    secret: 'IM4G6QTIONHS63SRKRBEU4LEIRSTIQTM',
    token: '668733'
  },
  {
    epoch: 1565106018408,
    secret: 'PIZGURTBIZ2EU4SNGFKHE5LXKVEFA6CM',
    token: '767234'
  },
  {
    epoch: 1565106407848,
    secret: 'LA2XU3LZO53SWWJVKFVFU3TGIQZEU3SF',
    token: '942732'
  },
  {
    epoch: 1565106431089,
    secret: 'PE4U4RBVMJFE6V2VOBEGINLKMJ3G4LZZ',
    token: '235413'
  },
  {
    epoch: 1565106483557,
    secret: 'I5JUGURXO5TTGVRUGBBUGU2TNZMVSVTP',
    token: '508543'
  }
];

export function base32TestSuite(name: string, opt: TestPkg): void {
  describe(`${name}`, (): void => {
    testKeys.forEach((entry, idx): void => {
      test(`key #${idx} - decode`, (): void => {
        expect(opt.keyDecoder(entry.encoded, KeyEncodings.HEX)).toBe(
          entry.decoded
        );
      });

      test(`key #${idx} - encode`, (): void => {
        expect(opt.keyEncoder(entry.decoded, KeyEncodings.HEX)).toBe(
          entry.encoded
        );
      });
    });
  });

  describe(`otplib-node + ${name}`, (): void => {
    tokenSets.forEach((entry): void => {
      test(`epoch ${entry.epoch}`, (): void => {
        authenticator.options = {
          epoch: entry.epoch,
          keyDecoder: opt.keyDecoder
        };

        expect(authenticator.generate(entry.secret)).toBe(entry.token);
      });
    });
  });
}
