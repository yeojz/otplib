import { generate, verify } from "otplib";

import type { OtpData } from "../types.js";

export async function generateOtp(data: OtpData): Promise<string> {
  if (data.type === "totp") {
    return generate({
      strategy: "totp",
      secret: data.secret,
      digits: data.digits,
      algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
      period: data.period,
    });
  }

  return generate({
    strategy: "hotp",
    secret: data.secret,
    digits: data.digits,
    algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
    counter: data.counter,
  });
}

export async function verifyOtp(data: OtpData, token: string): Promise<boolean> {
  if (data.type === "totp") {
    const result = await verify({
      strategy: "totp",
      secret: data.secret,
      token,
      digits: data.digits,
      algorithm: data.algorithm.toLowerCase() as "sha1" | "sha256" | "sha512",
      period: data.period,
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
  });
  return result.valid;
}
