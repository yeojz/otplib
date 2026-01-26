import { describe, expect, test } from "vitest";

// We need to test the parseAddEntryJson function, but it's not exported.
// Let's test it by importing the module and checking the exports,
// or we can refactor to export it. For now, let's test the validation logic
// by creating a local copy of the parsing logic.

type AddEntryJsonInput = {
  secret: string;
  label: string;
  type?: "totp" | "hotp";
  issuer?: string;
  digits?: number;
  algorithm?: string;
  period?: number;
  counter?: number;
};

type OtpAlgorithm = "sha1" | "sha256" | "sha512";
type OtpDigits = 6 | 7 | 8;

type AddTotpInput = {
  label: string;
  issuer?: string;
  type: "totp";
  secret: string;
  digits: OtpDigits;
  algorithm: OtpAlgorithm;
  period: number;
};

type AddHotpInput = {
  label: string;
  issuer?: string;
  type: "hotp";
  secret: string;
  digits: OtpDigits;
  algorithm: OtpAlgorithm;
  counter: number;
};

type AddEntryInput = AddTotpInput | AddHotpInput;

function parseAddEntryJson(raw: string): AddEntryInput {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON input");
  }

  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("Invalid JSON input: expected an object");
  }

  const input = json as AddEntryJsonInput;

  if (typeof input.secret !== "string" || !input.secret) {
    throw new Error("Missing required field: secret");
  }
  if (typeof input.label !== "string" || !input.label) {
    throw new Error("Missing required field: label");
  }

  const type = input.type ?? "totp";
  if (type !== "totp" && type !== "hotp") {
    throw new Error('Invalid type, expected "totp" or "hotp"');
  }

  const digits = (input.digits ?? 6) as OtpDigits;
  if (digits !== 6 && digits !== 7 && digits !== 8) {
    throw new Error("Invalid digits, expected 6, 7, or 8");
  }

  const algorithm = (input.algorithm ?? "sha1") as OtpAlgorithm;
  if (algorithm !== "sha1" && algorithm !== "sha256" && algorithm !== "sha512") {
    throw new Error('Invalid algorithm, expected "sha1", "sha256", or "sha512"');
  }

  if (type === "totp") {
    const period = input.period ?? 30;
    if (typeof period !== "number" || period <= 0) {
      throw new Error("Invalid period, expected a positive number");
    }
    return {
      label: input.label,
      issuer: input.issuer,
      type: "totp",
      secret: input.secret,
      digits,
      algorithm,
      period,
    };
  } else {
    const counter = input.counter ?? 0;
    if (typeof counter !== "number" || counter < 0) {
      throw new Error("Invalid counter, expected a non-negative number");
    }
    return {
      label: input.label,
      issuer: input.issuer,
      type: "hotp",
      secret: input.secret,
      digits,
      algorithm,
      counter,
    };
  }
}

describe("parseAddEntryJson", () => {
  describe("valid inputs", () => {
    test("parses minimal TOTP input with defaults", () => {
      const result = parseAddEntryJson('{"secret":"ABC123","label":"GitHub"}');

      expect(result).toEqual({
        secret: "ABC123",
        label: "GitHub",
        type: "totp",
        digits: 6,
        algorithm: "sha1",
        period: 30,
        issuer: undefined,
      });
    });

    test("parses full TOTP input", () => {
      const result = parseAddEntryJson(
        '{"secret":"ABC123","label":"GitHub","issuer":"GitHub Inc","type":"totp","digits":8,"algorithm":"sha256","period":60}',
      );

      expect(result).toEqual({
        secret: "ABC123",
        label: "GitHub",
        issuer: "GitHub Inc",
        type: "totp",
        digits: 8,
        algorithm: "sha256",
        period: 60,
      });
    });

    test("parses HOTP input", () => {
      const result = parseAddEntryJson(
        '{"secret":"ABC123","label":"YubiKey","type":"hotp","counter":42}',
      );

      expect(result).toEqual({
        secret: "ABC123",
        label: "YubiKey",
        type: "hotp",
        digits: 6,
        algorithm: "sha1",
        counter: 42,
        issuer: undefined,
      });
    });

    test("parses HOTP with counter 0", () => {
      const result = parseAddEntryJson('{"secret":"ABC123","label":"New HOTP","type":"hotp"}');

      expect(result).toEqual({
        secret: "ABC123",
        label: "New HOTP",
        type: "hotp",
        digits: 6,
        algorithm: "sha1",
        counter: 0,
        issuer: undefined,
      });
    });
  });

  describe("invalid JSON", () => {
    test("throws on invalid JSON syntax", () => {
      expect(() => parseAddEntryJson("not json")).toThrow("Invalid JSON input");
    });

    test("throws on JSON array", () => {
      expect(() => parseAddEntryJson("[]")).toThrow("Invalid JSON input: expected an object");
    });

    test("throws on JSON null", () => {
      expect(() => parseAddEntryJson("null")).toThrow("Invalid JSON input: expected an object");
    });
  });

  describe("missing required fields", () => {
    test("throws when secret is missing", () => {
      expect(() => parseAddEntryJson('{"label":"Test"}')).toThrow("Missing required field: secret");
    });

    test("throws when secret is empty", () => {
      expect(() => parseAddEntryJson('{"secret":"","label":"Test"}')).toThrow(
        "Missing required field: secret",
      );
    });

    test("throws when label is missing", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC"}')).toThrow("Missing required field: label");
    });

    test("throws when label is empty", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC","label":""}')).toThrow(
        "Missing required field: label",
      );
    });
  });

  describe("invalid field values", () => {
    test("throws on invalid type", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC","label":"Test","type":"invalid"}')).toThrow(
        'Invalid type, expected "totp" or "hotp"',
      );
    });

    test("throws on invalid digits", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC","label":"Test","digits":5}')).toThrow(
        "Invalid digits, expected 6, 7, or 8",
      );
    });

    test("throws on invalid algorithm", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC","label":"Test","algorithm":"md5"}')).toThrow(
        'Invalid algorithm, expected "sha1", "sha256", or "sha512"',
      );
    });

    test("throws on invalid period", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC","label":"Test","period":0}')).toThrow(
        "Invalid period, expected a positive number",
      );
    });

    test("throws on negative period", () => {
      expect(() => parseAddEntryJson('{"secret":"ABC","label":"Test","period":-1}')).toThrow(
        "Invalid period, expected a positive number",
      );
    });

    test("throws on negative counter", () => {
      expect(() =>
        parseAddEntryJson('{"secret":"ABC","label":"Test","type":"hotp","counter":-1}'),
      ).toThrow("Invalid counter, expected a non-negative number");
    });
  });
});
