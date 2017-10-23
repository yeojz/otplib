import crypto from "./crypto";

describe("crypto", () => {
  test("should expose an object with a used method", () => {
    expect(typeof crypto).toBe("object");
    expect(typeof crypto.createHmac).toBe("function");
    expect(typeof crypto.randomBytes).toBe("function");
  });
});
