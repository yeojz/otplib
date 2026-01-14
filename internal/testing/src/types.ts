/**
 * Shared test context types for dependency injection
 *
 * This allows the same test logic to run across different runtimes
 * (Node.js/Vitest, Bun, Deno) by injecting the test framework and crypto plugin.
 */

/**
 * Expectation matcher type - subset of Vitest/Jest expect API
 */
export type ExpectMatchers<T> = {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toMatch(pattern: RegExp): void;
  toHaveLength(length: number): void;
  toBeGreaterThan(expected: number): void;
  toBeGreaterThanOrEqual(expected: number): void;
  toBeLessThan(expected: number): void;
  toBeLessThanOrEqual(expected: number): void;
  toBeInstanceOf(expected: new (...args: unknown[]) => unknown): void;
  toThrow(expected?: string | RegExp | Error | (new (...args: any[]) => any)): void;
  toContain(expected: string): void;
  toBeTruthy(): void;
  not: ExpectMatchers<T>;
  /** For asserting rejected promises */
  rejects: ExpectMatchers<T>;
};

/**
 * Expect function type
 */
export type ExpectFn = <T>(actual: T) => ExpectMatchers<T>;

/**
 * Test context type for dependency injection
 */
export type TestContext<TCrypto = any, TBase32 = any> = {
  /** describe block function */
  describe: (name: string, fn: () => void) => void;
  /** it/test function */
  it: (name: string, fn: () => Promise<void> | void) => void;
  /** expect assertion function */
  expect: ExpectFn;
  /** Crypto plugin to use for tests */
  crypto: TCrypto;
  /** Optional Base32 plugin for authenticator tests */
  base32?: TBase32;
};

/**
 * Type for test suite creator functions
 */
export type TestSuiteCreator<TCrypto = any, TBase32 = any> = (
  ctx: TestContext<TCrypto, TBase32>,
) => void;
