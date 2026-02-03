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
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    throw new Error("Invalid URI: must start with otpauth://");
  }

  if (url.protocol !== "otpauth:") {
    throw new Error("Invalid URI: must start with otpauth://");
  }

  if (url.hostname !== "totp" && url.hostname !== "hotp") {
    throw new Error(`Invalid type: ${url.hostname}, expected totp or hotp`);
  }

  if (url.pathname === "") {
    throw new Error("Invalid URI format: missing path");
  }

  const type = url.hostname as "totp" | "hotp";
  const label = decodeURIComponent(url.pathname.slice(1));

  const secret = url.searchParams.get("secret");
  if (!secret) {
    throw new Error("Missing required parameter: secret");
  }

  let issuer = url.searchParams.get("issuer") || undefined;
  let account = label;

  const colonIndex = label.indexOf(":");
  if (colonIndex !== -1) {
    issuer = issuer || label.slice(0, colonIndex);
    account = label.slice(colonIndex + 1);
  }

  const algorithm = normalizeAlgorithm(url.searchParams.get("algorithm") ?? undefined);
  const digitsParam = url.searchParams.get("digits");
  const digits = normalizeDigits(digitsParam !== null ? parseInt(digitsParam, 10) : undefined);

  if (type === "totp") {
    const periodParam = url.searchParams.get("period");
    const period = periodParam !== null ? parseInt(periodParam, 10) : 30;
    if (period <= 0) throw new Error("Invalid period: must be positive");
    return { type: "totp", secret, issuer, account, algorithm, digits, period };
  } else {
    const counterParam = url.searchParams.get("counter");
    const counter = counterParam !== null ? parseInt(counterParam, 10) : 0;
    if (counter < 0) throw new Error("Invalid counter: must be non-negative");
    return { type: "hotp", secret, issuer, account, algorithm, digits, counter };
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
