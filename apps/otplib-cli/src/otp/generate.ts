import { generate } from "otplib";

import type { VaultEntry } from "../vault/format.js";

export async function generateOtp(entry: VaultEntry): Promise<string> {
  if (entry.type === "totp") {
    return generate({
      strategy: "totp",
      secret: entry.secret,
      digits: entry.digits,
      algorithm: entry.algorithm,
      period: entry.period,
    });
  }

  return generate({
    strategy: "hotp",
    secret: entry.secret,
    digits: entry.digits,
    algorithm: entry.algorithm,
    counter: entry.counter,
  });
}
