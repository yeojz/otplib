import { describe, expect, test } from "vitest";
import {
  parseOtpauthUri,
  parseJsonInput,
  parseAddInput,
  parseDotenvxInput,
  findEntry,
  updateHotpCounter,
} from "../src/parse.js";
import { encodePayload } from "../src/types.js";
import type { HotpData, OtpPayload, TotpData } from "../src/types.js";

describe("parseOtpauthUri", () => {
  test("parses minimal TOTP URI", () => {
    const result = parseOtpauthUri("otpauth://totp/GitHub:user?secret=JBSWY3DPEHPK3PXP");

    expect(result).toEqual({
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP",
      issuer: "GitHub",
      account: "user",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
  });

  test("parses TOTP URI with all parameters", () => {
    const result = parseOtpauthUri(
      "otpauth://totp/AWS:admin?secret=ABC123&issuer=AWS&algorithm=SHA256&digits=8&period=60",
    );

    expect(result).toEqual({
      type: "totp",
      secret: "ABC123",
      issuer: "AWS",
      account: "admin",
      algorithm: "SHA256",
      digits: 8,
      period: 60,
    });
  });

  test("parses HOTP URI", () => {
    const result = parseOtpauthUri("otpauth://hotp/Slack:workspace?secret=XYZ&counter=5");

    expect(result).toEqual({
      type: "hotp",
      secret: "XYZ",
      issuer: "Slack",
      account: "workspace",
      algorithm: "SHA1",
      digits: 6,
      counter: 5,
    });
  });

  test("parses URI with encoded label", () => {
    const result = parseOtpauthUri("otpauth://totp/GitHub%3Auser%40example.com?secret=ABC");

    expect(result).toEqual({
      type: "totp",
      secret: "ABC",
      issuer: "GitHub",
      account: "user@example.com",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
  });

  test("throws on invalid scheme", () => {
    expect(() => parseOtpauthUri("http://totp/Test?secret=ABC")).toThrow(
      "Invalid URI: must start with otpauth://",
    );
  });

  test("throws on missing path", () => {
    expect(() => parseOtpauthUri("otpauth://totp")).toThrow("Invalid URI format: missing path");
  });

  test("throws on invalid type", () => {
    expect(() => parseOtpauthUri("otpauth://invalid/Test?secret=ABC")).toThrow(
      "Invalid type: invalid, expected totp or hotp",
    );
  });

  test("throws on missing secret", () => {
    expect(() => parseOtpauthUri("otpauth://totp/Test?issuer=Test")).toThrow(
      "Missing required parameter: secret",
    );
  });

  test("throws on invalid algorithm", () => {
    expect(() => parseOtpauthUri("otpauth://totp/Test?secret=ABC&algorithm=MD5")).toThrow(
      "Invalid algorithm: MD5, expected SHA1, SHA256, or SHA512",
    );
  });
});

describe("parseJsonInput", () => {
  test("parses minimal TOTP JSON with defaults", () => {
    const result = parseJsonInput('{"secret":"ABC123"}');

    expect(result).toEqual({
      type: "totp",
      secret: "ABC123",
      issuer: undefined,
      account: undefined,
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    });
  });

  test("parses full TOTP JSON", () => {
    const result = parseJsonInput(
      '{"secret":"ABC123","issuer":"GitHub","account":"user","type":"totp","digits":8,"algorithm":"sha256","period":60}',
    );

    expect(result).toEqual({
      type: "totp",
      secret: "ABC123",
      issuer: "GitHub",
      account: "user",
      algorithm: "SHA256",
      digits: 8,
      period: 60,
    });
  });

  test("parses HOTP JSON", () => {
    const result = parseJsonInput('{"secret":"XYZ","type":"hotp","counter":10}');

    expect(result).toEqual({
      type: "hotp",
      secret: "XYZ",
      issuer: undefined,
      account: undefined,
      algorithm: "SHA1",
      digits: 6,
      counter: 10,
    });
  });

  test("throws on invalid JSON", () => {
    expect(() => parseJsonInput("not json")).toThrow("Invalid JSON input");
  });

  test("throws on JSON array", () => {
    expect(() => parseJsonInput("[]")).toThrow("Invalid JSON input: expected an object");
  });

  test("throws on missing secret", () => {
    expect(() => parseJsonInput('{"issuer":"Test"}')).toThrow("Missing required field: secret");
  });

  test("throws on invalid type", () => {
    expect(() => parseJsonInput('{"secret":"ABC","type":"invalid"}')).toThrow(
      'Invalid type: expected "totp" or "hotp"',
    );
  });

  test("throws on invalid digits", () => {
    expect(() => parseJsonInput('{"secret":"ABC","digits":5}')).toThrow(
      "Invalid digits: 5, expected 6, 7, or 8",
    );
  });

  test("throws on invalid period (non-positive)", () => {
    expect(() => parseJsonInput('{"secret":"ABC","type":"totp","period":0}')).toThrow(
      "Invalid period: must be a positive number",
    );
  });

  test("throws on invalid period (negative)", () => {
    expect(() => parseJsonInput('{"secret":"ABC","type":"totp","period":-1}')).toThrow(
      "Invalid period: must be a positive number",
    );
  });

  test("throws on invalid counter (negative)", () => {
    expect(() => parseJsonInput('{"secret":"ABC","type":"hotp","counter":-1}')).toThrow(
      "Invalid counter: must be a non-negative number",
    );
  });
});

describe("parseAddInput", () => {
  test("auto-detects otpauth URI", () => {
    const result = parseAddInput("otpauth://totp/Test?secret=ABC");

    expect(result.type).toBe("totp");
    expect(result.secret).toBe("ABC");
  });

  test("auto-detects JSON", () => {
    const result = parseAddInput('{"secret":"XYZ"}');

    expect(result.type).toBe("totp");
    expect(result.secret).toBe("XYZ");
  });

  test("handles whitespace around input", () => {
    const result = parseAddInput("  \n  otpauth://totp/Test?secret=ABC  \n  ");

    expect(result.secret).toBe("ABC");
  });
});

describe("parseDotenvxInput", () => {
  test("parses empty object", () => {
    const result = parseDotenvxInput("{}");

    expect(result).toEqual([]);
  });

  test("parses single entry", () => {
    const payload: OtpPayload = {
      data: {
        type: "totp",
        secret: "ABC",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      },
    };
    const encoded = encodePayload(payload);
    const result = parseDotenvxInput(`{"abc123":"${encoded}"}`);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("abc123");
    expect(result[0].payload.data.secret).toBe("ABC");
  });

  test("parses multiple entries", () => {
    const payload1: OtpPayload = {
      data: { type: "totp", secret: "A", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const payload2: OtpPayload = {
      data: { type: "hotp", secret: "B", algorithm: "SHA1", digits: 6, counter: 0 },
    };
    const result = parseDotenvxInput(
      `{"id1":"${encodePayload(payload1)}","id2":"${encodePayload(payload2)}"}`,
    );

    expect(result).toHaveLength(2);
  });

  test("skips malformed entries", () => {
    const payload: OtpPayload = {
      data: { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const result = parseDotenvxInput(
      `{"good":"${encodePayload(payload)}","bad":"not-base64-json"}`,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("good");
  });

  test("throws on invalid JSON", () => {
    expect(() => parseDotenvxInput("not json")).toThrow("Invalid JSON input from dotenvx");
  });

  test("throws on array input", () => {
    expect(() => parseDotenvxInput("[]")).toThrow(
      "Invalid input: expected JSON object from dotenvx get --all",
    );
  });
});

describe("findEntry", () => {
  const entries = [
    {
      id: "abc",
      payload: {
        data: {
          type: "totp" as const,
          secret: "A",
          algorithm: "SHA1" as const,
          digits: 6 as const,
          period: 30,
        },
      },
    },
    {
      id: "xyz",
      payload: {
        data: {
          type: "hotp" as const,
          secret: "B",
          algorithm: "SHA1" as const,
          digits: 6 as const,
          counter: 0,
        },
      },
    },
  ];

  test("finds entry by id", () => {
    const result = findEntry(entries, "abc");

    expect(result?.id).toBe("abc");
  });

  test("returns undefined for missing id", () => {
    const result = findEntry(entries, "missing");

    expect(result).toBeUndefined();
  });
});

describe("updateHotpCounter", () => {
  const hotpData: HotpData = {
    type: "hotp",
    secret: "ABC",
    algorithm: "SHA1",
    digits: 6,
    counter: 5,
  };

  test("increments counter by default", () => {
    const result = updateHotpCounter(hotpData);

    expect(result.counter).toBe(6);
  });

  test("sets counter to specific value", () => {
    const result = updateHotpCounter(hotpData, 10);

    expect(result.counter).toBe(10);
  });

  test("preserves other fields", () => {
    const result = updateHotpCounter(hotpData);

    expect(result.secret).toBe("ABC");
    expect(result.type).toBe("hotp");
  });
});
