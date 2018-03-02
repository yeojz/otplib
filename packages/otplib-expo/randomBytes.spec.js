import randomBytes from "./randomBytes";

describe("randomBytes", () => {
  const tooLarge = "Requested size of random bytes is too large";
  const wrongSize = "Requested size must be more than 0";

  it(`[${name}] should return a buffer`, () => {
    const result = randomBytes(10);
    expect(result).toBeInstanceOf(Buffer);
    expect(result).toHaveLength(10);
  });

  it(`[${name}] should throw when size is too big`, () => {
    expect(() => randomBytes(65537)).toThrowError(tooLarge);
  });

  it(`[${name}] should throw when size is < 1`, () => {
    expect(() => randomBytes(0)).toThrowError(wrongSize);
  });
});
