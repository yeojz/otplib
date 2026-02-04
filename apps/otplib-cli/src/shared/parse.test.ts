import { describe, expect, test } from "vitest";
import {
  parseOtpauthUri,
  parseJsonInput,
  parseAddInput,
  parseEnvInput,
  parseDotenvxInput,
  findEntry,
  updateHotpCounter,
} from "./parse.js";
import { encodePayload } from "./types.js";
import type { HotpData, OtpPayload } from "./types.js";

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

  test("throws on malformed URI", () => {
    // new URL(":") throws TypeError
    expect(() => parseOtpauthUri(":")).toThrow("Invalid URI: must start with otpauth://");
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

  test("throws on invalid digits", () => {
    expect(() => parseOtpauthUri("otpauth://totp/Test?secret=ABC&digits=5")).toThrow(
      "Invalid digits: 5, expected 6, 7, or 8",
    );
  });

  test("skips query params without equals sign", () => {
    const result = parseOtpauthUri("otpauth://totp/Test?secret=ABC&invalid&digits=7");

    expect(result.secret).toBe("ABC");
    expect(result.digits).toBe(7);
  });

  test("parses HOTP with default counter", () => {
    const result = parseOtpauthUri("otpauth://hotp/Test?secret=ABC");

    expect(result.type).toBe("hotp");
    expect((result as HotpData).counter).toBe(0);
  });

  test("throws on invalid period (non-positive)", () => {
    expect(() => parseOtpauthUri("otpauth://totp/Test?secret=ABC&period=0")).toThrow(
      "Invalid period: must be positive",
    );
  });

  test("throws on HOTP with negative counter", () => {
    expect(() => parseOtpauthUri("otpauth://hotp/Test?secret=ABC&counter=-1")).toThrow(
      "Invalid counter: must be non-negative",
    );
  });

  test("parses URI with label but no issuer prefix", () => {
    const result = parseOtpauthUri("otpauth://totp/account?secret=ABC&issuer=MyIssuer");

    expect(result.issuer).toBe("MyIssuer");
    expect(result.account).toBe("account");
  });

  test("parses SHA512 algorithm", () => {
    const result = parseOtpauthUri("otpauth://totp/Test?secret=ABC&algorithm=SHA512");

    expect(result.algorithm).toBe("SHA512");
  });

  test("parses algorithm with hyphen (sha-256)", () => {
    const result = parseOtpauthUri("otpauth://totp/Test?secret=ABC&algorithm=sha-256");

    expect(result.algorithm).toBe("SHA256");
  });

  test("parses 7 digits", () => {
    const result = parseOtpauthUri("otpauth://totp/Test?secret=ABC&digits=7");

    expect(result.digits).toBe(7);
  });

  test("parses explicit SHA1 algorithm", () => {
    const result = parseOtpauthUri("otpauth://totp/Test?secret=ABC&algorithm=SHA1");

    expect(result.algorithm).toBe("SHA1");
  });

  test("throws on URI without query params", () => {
    expect(() => parseOtpauthUri("otpauth://totp/Test")).toThrow(
      "Missing required parameter: secret",
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

  test("parses HOTP JSON with default counter", () => {
    const result = parseJsonInput('{"secret":"XYZ","type":"hotp"}');

    expect(result).toEqual({
      type: "hotp",
      secret: "XYZ",
      issuer: undefined,
      account: undefined,
      algorithm: "SHA1",
      digits: 6,
      counter: 0,
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

  test("throws on non-number counter", () => {
    expect(() => parseJsonInput('{"secret":"ABC","type":"hotp","counter":"not-a-number"}')).toThrow(
      "Invalid counter: must be a non-negative number",
    );
  });

  test("throws on non-number period", () => {
    expect(() => parseJsonInput('{"secret":"ABC","type":"totp","period":"not-a-number"}')).toThrow(
      "Invalid period: must be a positive number",
    );
  });

  test("throws on null input", () => {
    expect(() => parseJsonInput("null")).toThrow("Invalid JSON input: expected an object");
  });

  test("throws on empty secret", () => {
    expect(() => parseJsonInput('{"secret":""}')).toThrow("Missing required field: secret");
  });

  test("throws on non-string secret", () => {
    expect(() => parseJsonInput('{"secret":123}')).toThrow("Missing required field: secret");
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

    expect(result.entries).toEqual([]);
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

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe("abc123");
    expect(result.entries[0].payload.data.secret).toBe("ABC");
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

    expect(result.entries).toHaveLength(2);
  });

  test("skips malformed entries", () => {
    const payload: OtpPayload = {
      data: { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const result = parseDotenvxInput(
      `{"good":"${encodePayload(payload)}","bad":"not-base64-json"}`,
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe("good");
  });

  test("throws on invalid JSON", () => {
    expect(() => parseDotenvxInput("not json")).toThrow("Invalid JSON input");
  });

  test("throws on array input", () => {
    expect(() => parseDotenvxInput("[]")).toThrow("Invalid input: expected JSON object");
  });

  test("skips non-string values", () => {
    const payload: OtpPayload = {
      data: { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const result = parseDotenvxInput(
      `{"good":"${encodePayload(payload)}","number":123,"boolean":true,"null":null,"object":{}}`,
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe("good");
  });
});

describe("parseEnvInput", () => {
  test("extracts OTPLIB_MIN_SECRET_BYTES", () => {
    const payload: OtpPayload = {
      data: { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const result = parseEnvInput(
      `{"A12345678":"${encodePayload(payload)}","OTPLIB_MIN_SECRET_BYTES":"10"}`,
    );

    expect(result.entries).toHaveLength(1);
    expect(result.guardrails).toEqual({ MIN_SECRET_BYTES: 10 });
  });

  test("extracts all guardrail variables", () => {
    const result = parseEnvInput(
      `{"OTPLIB_MIN_SECRET_BYTES":"8","OTPLIB_MAX_SECRET_BYTES":"128","OTPLIB_MIN_PERIOD":"5","OTPLIB_MAX_PERIOD":"7200"}`,
    );

    expect(result.entries).toHaveLength(0);
    expect(result.guardrails).toEqual({
      MIN_SECRET_BYTES: 8,
      MAX_SECRET_BYTES: 128,
      MIN_PERIOD: 5,
      MAX_PERIOD: 7200,
    });
  });

  test("ignores invalid guardrail values (non-numeric)", () => {
    const result = parseEnvInput(`{"OTPLIB_MIN_SECRET_BYTES":"abc"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid guardrail values (zero)", () => {
    const result = parseEnvInput(`{"OTPLIB_MIN_SECRET_BYTES":"0"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid guardrail values (negative)", () => {
    const result = parseEnvInput(`{"OTPLIB_MIN_SECRET_BYTES":"-1"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid MAX_SECRET_BYTES values (non-numeric)", () => {
    const result = parseEnvInput(`{"OTPLIB_MAX_SECRET_BYTES":"abc"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid MAX_SECRET_BYTES values (zero)", () => {
    const result = parseEnvInput(`{"OTPLIB_MAX_SECRET_BYTES":"0"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid MIN_PERIOD values (non-numeric)", () => {
    const result = parseEnvInput(`{"OTPLIB_MIN_PERIOD":"abc"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid MIN_PERIOD values (zero)", () => {
    const result = parseEnvInput(`{"OTPLIB_MIN_PERIOD":"0"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid MAX_PERIOD values (non-numeric)", () => {
    const result = parseEnvInput(`{"OTPLIB_MAX_PERIOD":"abc"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("ignores invalid MAX_PERIOD values (zero)", () => {
    const result = parseEnvInput(`{"OTPLIB_MAX_PERIOD":"0"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("returns undefined guardrails when none present", () => {
    const payload: OtpPayload = {
      data: { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const result = parseEnvInput(`{"A12345678":"${encodePayload(payload)}"}`);

    expect(result.entries).toHaveLength(1);
    expect(result.guardrails).toBeUndefined();
  });

  test("ignores unknown OTPLIB_ prefixed keys", () => {
    const result = parseEnvInput(`{"OTPLIB_UNKNOWN":"value"}`);

    expect(result.guardrails).toBeUndefined();
  });

  test("parses entries with custom key format", () => {
    const payload: OtpPayload = {
      data: { type: "totp", secret: "ABC", algorithm: "SHA1", digits: 6, period: 30 },
    };
    const result = parseEnvInput(`{"CUSTOM_ID":"${encodePayload(payload)}"}`);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].id).toBe("CUSTOM_ID");
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
