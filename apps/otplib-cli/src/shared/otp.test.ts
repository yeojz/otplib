import { describe, expect, test, vi } from "vitest";
import { generateOtp, verifyOtp } from "./otp.js";
import type { TotpData, HotpData } from "./types.js";

describe("generateOtp", () => {
  const fixedTime = 1704067200000;

  test("generates TOTP code with default params", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      period: 30,
    };

    const code = await generateOtp(entry);

    expect(code).toMatch(/^\d{6}$/);
    vi.useRealTimers();
  });

  test("generates TOTP code with sha256", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 8,
      algorithm: "SHA256",
      period: 60,
    };

    const code = await generateOtp(entry);

    expect(code).toMatch(/^\d{8}$/);
    vi.useRealTimers();
  });

  test("generates HOTP code with counter", async () => {
    const entry: HotpData = {
      type: "hotp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      counter: 0,
    };

    const code = await generateOtp(entry);

    expect(code).toMatch(/^\d{6}$/);
  });

  test("same TOTP entry at same time returns consistent code", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      period: 30,
    };

    const code1 = await generateOtp(entry);
    const code2 = await generateOtp(entry);

    expect(code1).toBe(code2);
    vi.useRealTimers();
  });

  test("different HOTP counters return different codes", async () => {
    const entry1: HotpData = {
      type: "hotp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      counter: 0,
    };

    const entry2: HotpData = {
      ...entry1,
      counter: 1,
    };

    const code1 = await generateOtp(entry1);
    const code2 = await generateOtp(entry2);

    expect(code1).not.toBe(code2);
  });

  test("generates TOTP with short secret when guardrails allow", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP", // 10 bytes when decoded
      digits: 6,
      algorithm: "SHA1",
      period: 30,
    };

    const code = await generateOtp(entry, { MIN_SECRET_BYTES: 10 });

    expect(code).toMatch(/^\d{6}$/);
    vi.useRealTimers();
  });
});

describe("verifyOtp", () => {
  const fixedTime = 1704067200000;

  test("verifies valid TOTP token", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      period: 30,
    };

    const code = await generateOtp(entry);
    const valid = await verifyOtp(entry, code);

    expect(valid).toBe(true);
    vi.useRealTimers();
  });

  test("rejects invalid TOTP token", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      period: 30,
    };

    const valid = await verifyOtp(entry, "000000");

    expect(valid).toBe(false);
    vi.useRealTimers();
  });

  test("verifies valid HOTP token", async () => {
    const entry: HotpData = {
      type: "hotp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "SHA1",
      counter: 0,
    };

    const code = await generateOtp(entry);
    const valid = await verifyOtp(entry, code);

    expect(valid).toBe(true);
  });

  test("verifies TOTP with short secret when guardrails allow", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpData = {
      type: "totp",
      secret: "JBSWY3DPEHPK3PXP", // 10 bytes when decoded
      digits: 6,
      algorithm: "SHA1",
      period: 30,
    };

    const code = await generateOtp(entry, { MIN_SECRET_BYTES: 10 });
    const valid = await verifyOtp(entry, code, { MIN_SECRET_BYTES: 10 });

    expect(valid).toBe(true);
    vi.useRealTimers();
  });
});
