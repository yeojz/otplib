import { describe, it, expect } from "vitest";
import { Authenticator } from "./index";
import { BASE_SECRET_BASE32 } from "@repo/testing";

describe("Authenticator (v11-adapter)", () => {
  it("should generate token from base32 secret", () => {
    const auth = new Authenticator({ epoch: 0 });
    const secret = BASE_SECRET_BASE32 + BASE_SECRET_BASE32; // Ensure > 16 bytes
    const token = auth.generate(secret);

    expect(token).toHaveLength(6);
    expect(auth.check(token, secret)).toBe(true);
  });

  it("should generate secret in base32", () => {
    const auth = new Authenticator();
    const secret = auth.generateSecret();

    expect(secret).toMatch(/^[A-Z2-7]+=*$/);
  });

  it("should encode/decode secrets", () => {
    const auth = new Authenticator();
    const raw = "hello";
    const encoded = auth.encode(raw);
    const decoded = auth.decode(encoded);

    expect(encoded).not.toBe(raw);
    expect(decoded).toBe(raw);
  });
});
