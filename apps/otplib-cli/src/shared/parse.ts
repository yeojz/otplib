import { decodePayload } from "./types.js";

import type { HotpData, OtpAlgorithm, OtpData, OtpDigits, ParsedEntry } from "./types.js";
import type { OTPGuardrailsConfig } from "otplib";

type JsonInput = {
  secret: string;
  type?: "totp" | "hotp";
  issuer?: string;
  account?: string;
  algorithm?: string;
  digits?: number;
  period?: number;
  counter?: number;
};

export type ParsedEnv = {
  entries: ParsedEntry[];
  guardrails?: Partial<OTPGuardrailsConfig>;
};

function normalizeAlgorithm(alg?: string): OtpAlgorithm {
  if (!alg) return "SHA1";
  const upper = alg.toUpperCase().replace("-", "");
  if (upper === "SHA1") return "SHA1";
  if (upper === "SHA256") return "SHA256";
  if (upper === "SHA512") return "SHA512";
  throw new Error(`Invalid algorithm: ${alg}, expected SHA1, SHA256, or SHA512`);
}

function normalizeDigits(digits?: number): OtpDigits {
  if (digits === undefined) return 6;
  if (digits === 6 || digits === 7 || digits === 8) return digits;
  throw new Error(`Invalid digits: ${digits}, expected 6, 7, or 8`);
}

export function parseOtpauthUri(uri: string): OtpData {
  if (!uri.startsWith("otpauth://")) {
    throw new Error("Invalid URI: must start with otpauth://");
  }

  const withoutScheme = uri.slice("otpauth://".length);
  const slashIndex = withoutScheme.indexOf("/");
  if (slashIndex === -1) {
    throw new Error("Invalid URI format: missing path");
  }

  const type = withoutScheme.slice(0, slashIndex);
  if (type !== "totp" && type !== "hotp") {
    throw new Error(`Invalid type: ${type}, expected totp or hotp`);
  }

  const remaining = withoutScheme.slice(slashIndex + 1);
  const queryIndex = remaining.indexOf("?");
  const labelPart = queryIndex === -1 ? remaining : remaining.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? "" : remaining.slice(queryIndex + 1);

  const params: Record<string, string> = {};
  if (queryString) {
    for (const pair of queryString.split("&")) {
      const eqIndex = pair.indexOf("=");
      if (eqIndex !== -1) {
        const key = decodeURIComponent(pair.slice(0, eqIndex));
        const value = decodeURIComponent(pair.slice(eqIndex + 1));
        params[key] = value;
      }
    }
  }

  if (!params.secret) {
    throw new Error("Missing required parameter: secret");
  }

  const decodedLabel = decodeURIComponent(labelPart);
  let issuer = params.issuer;
  let account = decodedLabel;

  const colonIndex = decodedLabel.indexOf(":");
  if (colonIndex !== -1) {
    issuer = issuer || decodedLabel.slice(0, colonIndex);
    account = decodedLabel.slice(colonIndex + 1);
  }

  const algorithm = normalizeAlgorithm(params.algorithm);
  const digits = normalizeDigits(params.digits ? parseInt(params.digits, 10) : undefined);

  if (type === "totp") {
    const period = params.period ? parseInt(params.period, 10) : 30;
    if (period <= 0) throw new Error("Invalid period: must be positive");
    return { type: "totp", secret: params.secret, issuer, account, algorithm, digits, period };
  } else {
    const counter = params.counter ? parseInt(params.counter, 10) : 0;
    if (counter < 0) throw new Error("Invalid counter: must be non-negative");
    return { type: "hotp", secret: params.secret, issuer, account, algorithm, digits, counter };
  }
}

export function parseJsonInput(raw: string): OtpData {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON input");
  }

  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("Invalid JSON input: expected an object");
  }

  const input = json as JsonInput;

  if (typeof input.secret !== "string" || !input.secret) {
    throw new Error("Missing required field: secret");
  }

  const type = input.type ?? "totp";
  if (type !== "totp" && type !== "hotp") {
    throw new Error('Invalid type: expected "totp" or "hotp"');
  }

  const algorithm = normalizeAlgorithm(input.algorithm);
  const digits = normalizeDigits(input.digits);

  if (type === "totp") {
    const period = input.period ?? 30;
    if (typeof period !== "number" || period <= 0) {
      throw new Error("Invalid period: must be a positive number");
    }
    return {
      type: "totp",
      secret: input.secret,
      issuer: input.issuer,
      account: input.account,
      algorithm,
      digits,
      period,
    };
  } else {
    const counter = input.counter ?? 0;
    if (typeof counter !== "number" || counter < 0) {
      throw new Error("Invalid counter: must be a non-negative number");
    }
    return {
      type: "hotp",
      secret: input.secret,
      issuer: input.issuer,
      account: input.account,
      algorithm,
      digits,
      counter,
    };
  }
}

export function parseAddInput(raw: string): OtpData {
  const trimmed = raw.trim();
  if (trimmed.startsWith("otpauth://")) {
    return parseOtpauthUri(trimmed);
  }
  return parseJsonInput(trimmed);
}

export function parseEnvInput(raw: string): ParsedEnv {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON input");
  }

  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("Invalid input: expected JSON object");
  }

  const entries: ParsedEntry[] = [];
  const guardrails: Partial<OTPGuardrailsConfig> = {};

  for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
    if (typeof value !== "string") continue;

    if (key === "OTPLIB_MIN_SECRET_BYTES") {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        guardrails.MIN_SECRET_BYTES = parsed;
      }
    } else if (key === "OTPLIB_MAX_SECRET_BYTES") {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        guardrails.MAX_SECRET_BYTES = parsed;
      }
    } else if (key === "OTPLIB_MIN_PERIOD") {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        guardrails.MIN_PERIOD = parsed;
      }
    } else if (key === "OTPLIB_MAX_PERIOD") {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        guardrails.MAX_PERIOD = parsed;
      }
    } else {
      try {
        const payload = decodePayload(value);
        entries.push({ id: key, payload });
      } catch {
        // Skip malformed entries
      }
    }
  }

  return {
    entries,
    guardrails: Object.keys(guardrails).length > 0 ? guardrails : undefined,
  };
}

/** @deprecated Use parseEnvInput instead */
export const parseDotenvxInput = parseEnvInput;

export function findEntry(entries: ParsedEntry[], id: string): ParsedEntry | undefined {
  return entries.find((e) => e.id === id);
}

export function updateHotpCounter(data: HotpData, newCounter?: number): HotpData {
  return {
    ...data,
    counter: newCounter ?? data.counter + 1,
  };
}
