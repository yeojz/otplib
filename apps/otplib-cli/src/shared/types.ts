import crypto from "node:crypto";

export type OtpAlgorithm = "SHA1" | "SHA256" | "SHA512";
export type OtpDigits = 6 | 7 | 8;

export type TotpData = {
  type: "totp";
  secret: string;
  issuer?: string;
  account?: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  period: number;
};

export type HotpData = {
  type: "hotp";
  secret: string;
  issuer?: string;
  account?: string;
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  counter: number;
};

export type OtpData = TotpData | HotpData;

export type OtpPayload = {
  data: OtpData;
};

export type ParsedEntry = {
  id: string;
  payload: OtpPayload;
};

export function generateUid(bytes = 4): string {
  return "A" + crypto.randomBytes(bytes).toString("hex").toUpperCase();
}

export function encodePayload(payload: OtpPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

export function decodePayload(encoded: string): OtpPayload {
  const json = Buffer.from(encoded, "base64").toString("utf-8");
  return JSON.parse(json) as OtpPayload;
}

export function formatOutput(id: string, payload: OtpPayload): string {
  return `${id.toUpperCase()}=${encodePayload(payload)}`;
}

export function getLabel(data: OtpData): string {
  if (data.issuer && data.account) {
    return `${data.issuer}:${data.account}`;
  }
  return data.account || data.issuer || "Unknown";
}
