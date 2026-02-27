import { generate, verify, createGuardrails } from "otplib";

import type { OtpData } from "./types.js";
import type { OTPGuardrailsConfig } from "otplib";

export async function generateOtp(
  data: OtpData,
  customGuardrails?: Partial<OTPGuardrailsConfig>,
): Promise<string> {
  const guardrails = customGuardrails ? createGuardrails(customGuardrails) : undefined;

  if (data.type === "totp") {
    return generate({
      strategy: "totp",
      secret: data.secret,
      digits: data.digits,
      algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
      period: data.period,
      guardrails,
    });
  }

  return generate({
    strategy: "hotp",
    secret: data.secret,
    digits: data.digits,
    algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
    counter: data.counter,
    guardrails,
  });
}

export async function verifyOtp(
  data: OtpData,
  token: string,
  customGuardrails?: Partial<OTPGuardrailsConfig>,
): Promise<boolean> {
  const guardrails = customGuardrails ? createGuardrails(customGuardrails) : undefined;

  if (data.type === "totp") {
    const result = await verify({
      strategy: "totp",
      secret: data.secret,
      token,
      digits: data.digits,
      algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
      period: data.period,
      guardrails,
    });
    return result.valid;
  }

  const result = await verify({
    strategy: "hotp",
    secret: data.secret,
    token,
    digits: data.digits,
    algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
    counter: data.counter,
    guardrails,
  });
  return result.valid;
}
