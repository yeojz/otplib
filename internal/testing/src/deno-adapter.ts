/**
 * Deno adapter for shared tests
 *
 * Adapts Deno's test and assert APIs to match the TestContext interface,
 * allowing shared test logic to run in Deno.
 */

import type { TestContext, ExpectMatchers } from "./types.ts";

// Deno's assert functions - these are imported at runtime in the actual test files
// This is a factory that creates the adapter using Deno's assert module
type DenoAssert = {
  assertEquals: <T>(actual: T, expected: T, msg?: string) => void;
  assertNotEquals: <T>(actual: T, expected: T, msg?: string) => void;
  assertMatch: (actual: string, expected: RegExp, msg?: string) => void;
  assertThrows: (fn: () => void, msg?: string) => void;
  assertInstanceOf: <T>(actual: unknown, expected: new (...args: unknown[]) => T) => void;
};

/**
 * Creates expect-style matchers from Deno's assert functions using Proxy for DRY implementation
 */
function createExpect(assert: DenoAssert) {
  return function expect<T>(actual: T): ExpectMatchers<T> {
    return createMatchers(actual, assert, { negate: false, async: false });
  };
}

type MatcherFlags = {
  negate: boolean;
  async: boolean;
};

function createMatchers<T>(actual: T, assert: DenoAssert, flags: MatcherFlags): ExpectMatchers<T> {
  const baseMatcher = {
    toBe(expected: T) {
      if (flags.negate) {
        assert.assertNotEquals(actual, expected);
      } else {
        assert.assertEquals(actual, expected);
      }
    },
    toEqual(expected: T) {
      if (flags.negate) {
        assert.assertNotEquals(actual, expected);
      } else {
        assert.assertEquals(actual, expected);
      }
    },
    toMatch(pattern: RegExp) {
      const str = actual as unknown as string;
      const matches = pattern.test(str);
      if (flags.negate ? matches : !matches) {
        const msg = flags.negate
          ? `Expected "${str}" not to match ${pattern}`
          : `Expected "${str}" to match ${pattern}`;
        throw new Error(msg);
      }
    },
    toContain(expected: string) {
      const str = actual as unknown as string;
      const contains = str.includes(expected);
      if (flags.negate ? contains : !contains) {
        const msg = flags.negate
          ? `Expected "${str}" not to contain "${expected}"`
          : `Expected "${str}" to contain "${expected}"`;
        throw new Error(msg);
      }
    },
    toBeTruthy() {
      if (flags.negate ? actual : !actual) {
        const msg = flags.negate
          ? `Expected ${actual} not to be truthy`
          : `Expected ${actual} to be truthy`;
        throw new Error(msg);
      }
    },
    toHaveLength(length: number) {
      const arr = actual as unknown as { length: number };
      if (flags.negate) {
        assert.assertNotEquals(arr.length, length, `Expected length to not be ${length}`);
      } else {
        assert.assertEquals(arr.length, length, `Expected length ${length}, got ${arr.length}`);
      }
    },
    toBeGreaterThan(expected: number) {
      const num = actual as unknown as number;
      if (flags.negate ? num > expected : num <= expected) {
        const msg = flags.negate
          ? `Expected ${num} not to be greater than ${expected}`
          : `Expected ${num} to be greater than ${expected}`;
        throw new Error(msg);
      }
    },
    toBeGreaterThanOrEqual(expected: number) {
      const num = actual as unknown as number;
      if (flags.negate ? num >= expected : num < expected) {
        const msg = flags.negate
          ? `Expected ${num} not to be greater than or equal to ${expected}`
          : `Expected ${num} to be greater than or equal to ${expected}`;
        throw new Error(msg);
      }
    },
    toBeLessThan(expected: number) {
      const num = actual as unknown as number;
      if (flags.negate ? num < expected : num >= expected) {
        const msg = flags.negate
          ? `Expected ${num} not to be less than ${expected}`
          : `Expected ${num} to be less than ${expected}`;
        throw new Error(msg);
      }
    },
    toBeLessThanOrEqual(expected: number) {
      const num = actual as unknown as number;
      if (flags.negate ? num <= expected : num > expected) {
        const msg = flags.negate
          ? `Expected ${num} not to be less than or equal to ${expected}`
          : `Expected ${num} to be less than or equal to ${expected}`;
        throw new Error(msg);
      }
    },
    toBeInstanceOf(expected: new (...args: unknown[]) => unknown) {
      const isInstance = actual instanceof expected;
      if (flags.negate ? isInstance : !isInstance) {
        const msg = flags.negate
          ? `Expected value not to be instance of ${expected.name}`
          : `Expected value to be instance of ${expected.name}`;
        throw new Error(msg);
      }
    },
    async toThrow(expected?: string | RegExp | Error) {
      if (flags.async) {
        const promise = actual as unknown as Promise<unknown>;
        try {
          await promise;
          if (!flags.negate) {
            throw new Error("Expected promise to reject, but it resolved");
          }
        } catch (error) {
          if (flags.negate) {
            throw new Error(
              `Expected promise not to reject, but it rejected with: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
          if (expected !== undefined) {
            const message = error instanceof Error ? error.message : String(error);
            if (typeof expected === "string" && !message.includes(expected)) {
              throw new Error(`Expected error message to contain "${expected}", got "${message}"`);
            }
            if (expected instanceof RegExp && !expected.test(message)) {
              throw new Error(`Expected error message to match ${expected}, got "${message}"`);
            }
          }
        }
      } else {
        const fn = actual as unknown as () => void;
        if (flags.negate) {
          try {
            fn();
          } catch {
            throw new Error("Expected function not to throw");
          }
        } else {
          assert.assertThrows(fn);
        }
      }
    },
  };

  return new Proxy(baseMatcher, {
    get(target, prop) {
      if (prop === "not") {
        return createMatchers(actual, assert, { ...flags, negate: !flags.negate });
      }
      if (prop === "rejects") {
        return createMatchers(actual, assert, { ...flags, async: true });
      }
      return target[prop as keyof typeof target];
    },
  }) as unknown as ExpectMatchers<T>;
}

/**
 * Test collection for Deno
 * Since Deno.test must be called at the top level, we collect tests
 * and register them after the suite is built.
 */
type TestCase = {
  name: string;
  fn: () => Promise<void> | void;
};

type TestSuite = {
  name: string;
  tests: TestCase[];
  suites: TestSuite[];
};

/**
 * Creates a Deno test context with the given crypto plugin
 */
export function createDenoTestContext(
  assert: DenoAssert,
  { crypto, base32 }: Pick<TestContext, "crypto" | "base32">,
): TestContext & { runTests: () => void } {
  const rootSuite: TestSuite = { name: "", tests: [], suites: [] };
  const suiteStack: TestSuite[] = [rootSuite];

  const describe = (name: string, fn: () => void) => {
    const newSuite: TestSuite = { name, tests: [], suites: [] };
    suiteStack[suiteStack.length - 1].suites.push(newSuite);
    suiteStack.push(newSuite);
    fn();
    suiteStack.pop();
  };

  const it = (name: string, fn: () => Promise<void> | void) => {
    suiteStack[suiteStack.length - 1].tests.push({ name, fn });
  };

  const expect = createExpect(assert);

  // Recursive function to register tests with Deno.test
  const registerTests = (suite: TestSuite, prefix: string) => {
    const fullPrefix = prefix ? `${prefix} > ` : "";

    for (const test of suite.tests) {
      const testName = `${fullPrefix}${suite.name}${suite.name ? " > " : ""}${test.name}`;
      // Using globalThis to access Deno in a TypeScript-friendly way
      (
        globalThis as { Deno?: { test: (name: string, fn: () => Promise<void> | void) => void } }
      ).Deno?.test(testName, test.fn);
    }

    for (const childSuite of suite.suites) {
      registerTests(childSuite, `${fullPrefix}${suite.name}`);
    }
  };

  return {
    describe,
    it,
    expect,
    crypto,
    base32,
    runTests: () => registerTests(rootSuite, ""),
  };
}
