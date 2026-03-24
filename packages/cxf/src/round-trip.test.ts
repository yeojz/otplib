import { describe, it, expect } from "vitest";
import { fromCXF } from "./from-cxf.js";
import { toCXF } from "./to-cxf.js";
import type { OTPAccount } from "@otplib/core";

describe("round-trip: fromCXF(toCXF(accounts))", () => {
  it("should round-trip a single TOTP account", () => {
    const accounts: OTPAccount[] = [
      {
        type: "totp",
        secret: "JBSWY3DPEHPK3PXP",
        name: "user@example.com",
        issuer: "GitHub",
        algorithm: "sha256",
        digits: 8,
        period: 60,
      },
    ];

    const result = fromCXF(toCXF(accounts));

    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe("totp");
    expect(result[0]!.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(result[0]!.name).toBe("user@example.com");
    expect(result[0]!.issuer).toBe("GitHub");
    expect(result[0]!.algorithm).toBe("sha256");
    expect(result[0]!.digits).toBe(8);
    expect(result[0]!.period).toBe(60);
  });

  it("should round-trip multiple accounts", () => {
    const accounts: OTPAccount[] = [
      {
        type: "totp",
        secret: "AAA",
        name: "a@test.com",
        issuer: "Service A",
      },
      {
        type: "totp",
        secret: "BBB",
        name: "b@test.com",
        issuer: "Service B",
        algorithm: "sha512",
        digits: 8,
        period: 60,
      },
    ];

    const result = fromCXF(toCXF(accounts));

    expect(result).toHaveLength(2);
    expect(result[0]!.secret).toBe("AAA");
    expect(result[0]!.name).toBe("a@test.com");
    expect(result[1]!.secret).toBe("BBB");
    expect(result[1]!.algorithm).toBe("sha512");
  });

  it("should round-trip a minimal account with defaults", () => {
    const accounts: OTPAccount[] = [
      {
        type: "totp",
        secret: "JBSWY3DPEHPK3PXP",
      },
    ];

    const result = fromCXF(toCXF(accounts));

    expect(result).toHaveLength(1);
    expect(result[0]!.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(result[0]!.algorithm).toBe("sha1");
    expect(result[0]!.digits).toBe(6);
    expect(result[0]!.period).toBe(30);
  });

  it("should round-trip through JSON serialization", () => {
    const accounts: OTPAccount[] = [
      {
        type: "totp",
        secret: "JBSWY3DPEHPK3PXP",
        name: "user",
        issuer: "Svc",
        algorithm: "sha1",
        digits: 6,
        period: 30,
      },
    ];

    const json = JSON.stringify(toCXF(accounts));
    const result = fromCXF(json);

    expect(result).toHaveLength(1);
    expect(result[0]!.secret).toBe("JBSWY3DPEHPK3PXP");
    expect(result[0]!.name).toBe("user");
    expect(result[0]!.issuer).toBe("Svc");
  });

  it("should round-trip empty accounts", () => {
    const result = fromCXF(toCXF([]));
    expect(result).toEqual([]);
  });
});
