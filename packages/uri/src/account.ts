import { generateTOTP, generateHOTP } from "./generate.js";
import { parse } from "./parse.js";

import type { OTPAuthURI } from "./types.js";
import type { OTPAccount } from "@otplib/core";

/**
 * Parse an otpauth:// URI into an OTPAccount.
 *
 * Handles edge cases: missing optional params, URL-encoded characters,
 * URIs with or without the issuer prefix in the label.
 *
 * @param uri - The otpauth:// URI string
 * @returns An OTPAccount representing the parsed URI
 */
export function parseURI(uri: string): OTPAccount {
  const parsed: OTPAuthURI = parse(uri);

  let issuer = parsed.params.issuer;
  let name: string | undefined;

  const colonIndex = parsed.label.indexOf(":");
  if (colonIndex !== -1) {
    const labelIssuer = parsed.label.slice(0, colonIndex);
    name = parsed.label.slice(colonIndex + 1).trim();
    if (!issuer) {
      issuer = labelIssuer;
    }
  } else {
    name = parsed.label || undefined;
  }

  const account: OTPAccount = {
    type: parsed.type,
    secret: parsed.params.secret,
    ...(name !== undefined && { name }),
    ...(issuer !== undefined && { issuer }),
    ...(parsed.params.algorithm !== undefined && { algorithm: parsed.params.algorithm }),
    ...(parsed.params.digits !== undefined && { digits: parsed.params.digits }),
    ...(parsed.type === "totp" &&
      parsed.params.period !== undefined && { period: parsed.params.period }),
    ...(parsed.type === "hotp" &&
      parsed.params.counter !== undefined && { counter: parsed.params.counter }),
  };

  return account;
}

/**
 * Generate an otpauth:// URI from an OTPAccount.
 *
 * Constructs the label from issuer and name per the otpauth URI spec (issuer:name).
 *
 * @param account - The OTPAccount to convert to a URI
 * @returns otpauth:// URI string
 */
export function generateURIFromAccount(account: OTPAccount): string {
  const label = account.name ?? "";

  if (account.type === "totp") {
    return generateTOTP({
      issuer: account.issuer ?? "",
      label,
      secret: account.secret,
      algorithm: account.algorithm,
      digits: account.digits,
      period: account.period,
    });
  }

  return generateHOTP({
    issuer: account.issuer ?? "",
    label,
    secret: account.secret,
    algorithm: account.algorithm,
    digits: account.digits,
    counter: account.counter,
  });
}
