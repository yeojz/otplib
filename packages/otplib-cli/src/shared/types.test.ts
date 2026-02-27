import { describe, expect, test } from "vitest";
import { generateUid, encodePayload, decodePayload, formatOutput, getLabel } from "./types.js";
import type { OtpPayload, TotpData, HotpData } from "./types.js";

describe("generateUid", () => {
  test("generates 9-character string starting with A followed by hex", () => {
    const uid = generateUid();

    expect(uid).toMatch(/^A[0-9A-F]{8}$/);
  });

  test("generates unique UIDs", () => {
    const uids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uids.add(generateUid());
    }

    expect(uids.size).toBe(100);
  });

  test("respects custom byte length", () => {
    const uid2 = generateUid(2);
    const uid8 = generateUid(8);

    expect(uid2).toMatch(/^A[0-9A-F]{4}$/);
    expect(uid8).toMatch(/^A[0-9A-F]{16}$/);
  });
});

describe("encodePayload / decodePayload", () => {
  test("roundtrips TOTP payload", () => {
    const payload: OtpPayload = {
      data: {
        type: "totp",
        secret: "JBSWY3DPEHPK3PXP",
        issuer: "GitHub",
        account: "user",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      },
    };

    const encoded = encodePayload(payload);
    const decoded = decodePayload(encoded);

    expect(decoded).toEqual(payload);
  });

  test("roundtrips HOTP payload", () => {
    const payload: OtpPayload = {
      data: {
        type: "hotp",
        secret: "XYZ123",
        issuer: "AWS",
        account: "admin",
        algorithm: "SHA256",
        digits: 8,
        counter: 42,
      },
    };

    const encoded = encodePayload(payload);
    const decoded = decodePayload(encoded);

    expect(decoded).toEqual(payload);
  });

  test("encodes to valid base64", () => {
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

    expect(() => Buffer.from(encoded, "base64")).not.toThrow();
  });
});

describe("formatOutput", () => {
  test("formats as ID=base64 with uppercase key", () => {
    const payload: OtpPayload = {
      data: {
        type: "totp",
        secret: "ABC",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
      },
    };

    const output = formatOutput("abc123", payload);

    expect(output).toMatch(/^ABC123=.+$/);
    const [id, encoded] = output.split("=");
    expect(id).toBe("ABC123");
    expect(decodePayload(encoded)).toEqual(payload);
  });
});

describe("getLabel", () => {
  test("returns issuer:account when both present", () => {
    const data: TotpData = {
      type: "totp",
      secret: "ABC",
      issuer: "GitHub",
      account: "user@example.com",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    };

    expect(getLabel(data)).toBe("GitHub:user@example.com");
  });

  test("returns account when only account present", () => {
    const data: TotpData = {
      type: "totp",
      secret: "ABC",
      account: "user@example.com",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    };

    expect(getLabel(data)).toBe("user@example.com");
  });

  test("returns issuer when only issuer present", () => {
    const data: HotpData = {
      type: "hotp",
      secret: "ABC",
      issuer: "GitHub",
      algorithm: "SHA1",
      digits: 6,
      counter: 0,
    };

    expect(getLabel(data)).toBe("GitHub");
  });

  test("returns Unknown when neither present", () => {
    const data: TotpData = {
      type: "totp",
      secret: "ABC",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
    };

    expect(getLabel(data)).toBe("Unknown");
  });
});
