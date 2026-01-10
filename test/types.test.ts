import type { TOTPOptions, HOTPOptions, VerifyResult } from "otplib";
import { generateSecret, generate, verify, generateURI } from "otplib";
import * as totp from "@otplib/totp";
import * as hotp from "@otplib/hotp";
import * as uri from "@otplib/uri";
import * as core from "@otplib/core";

async function testTypes(): Promise<void> {
  const secret: string = generateSecret();

  const totpOptions: TOTPOptions = {
    secret,
    algorithm: "SHA1",
    digits: 6,
    step: 30,
  };

  const token: string = await generate(totpOptions);

  const result: VerifyResult = await verify({ secret, token });
  const isValid: boolean = result.valid;

  const hotpOptions: HOTPOptions = {
    secret,
    counter: 0,
    algorithm: "SHA1",
    digits: 6,
  };

  const hotpToken: string = await hotp.generate(hotpOptions);
  const hotpResult: VerifyResult = await hotp.verify({
    ...hotpOptions,
    token: hotpToken,
  });

  const otpauthURI: string = generateURI({
    type: "totp",
    label: "user@example.com",
    secret,
    issuer: "TestApp",
  });

  const parsed = uri.parse(otpauthURI);
  const parsedSecret: string | undefined = parsed.secret;

  const isValidSecret: boolean = core.isValidSecret(secret);

  console.log({
    secret,
    token,
    isValid,
    hotpToken,
    hotpResult: hotpResult.valid,
    otpauthURI,
    parsedSecret,
    isValidSecret,
  });
}

testTypes().catch(console.error);
