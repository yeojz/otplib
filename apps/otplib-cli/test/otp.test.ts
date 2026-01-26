import { describe, expect, test, vi } from "vitest";
import { generateOtp } from "../src/otp/generate.js";
import type { TotpEntry, HotpEntry } from "../src/vault/format.js";

describe("generateOtp", () => {
  const fixedTime = 1704067200000;

  test("generates TOTP code with default params", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpEntry = {
      id: "test-1",
      label: "Test",
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "sha1",
      period: 30,
    };

    const code = await generateOtp(entry);

    expect(code).toMatch(/^\d{6}$/);
    vi.useRealTimers();
  });

  test("generates TOTP code with sha256", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpEntry = {
      id: "test-2",
      label: "Test",
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 8,
      algorithm: "sha256",
      period: 60,
    };

    const code = await generateOtp(entry);

    expect(code).toMatch(/^\d{8}$/);
    vi.useRealTimers();
  });

  test("generates HOTP code with counter", async () => {
    const entry: HotpEntry = {
      id: "test-3",
      label: "Test",
      type: "hotp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "sha1",
      counter: 0,
    };

    const code = await generateOtp(entry);

    expect(code).toMatch(/^\d{6}$/);
  });

  test("same TOTP entry at same time returns consistent code", async () => {
    vi.setSystemTime(fixedTime);

    const entry: TotpEntry = {
      id: "test-4",
      label: "Test",
      type: "totp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "sha1",
      period: 30,
    };

    const code1 = await generateOtp(entry);
    const code2 = await generateOtp(entry);

    expect(code1).toBe(code2);
    vi.useRealTimers();
  });

  test("different HOTP counters return different codes", async () => {
    const entry1: HotpEntry = {
      id: "test-5",
      label: "Test",
      type: "hotp",
      secret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
      digits: 6,
      algorithm: "sha1",
      counter: 0,
    };

    const entry2: HotpEntry = {
      ...entry1,
      counter: 1,
    };

    const code1 = await generateOtp(entry1);
    const code2 = await generateOtp(entry2);

    expect(code1).not.toBe(code2);
  });
});
