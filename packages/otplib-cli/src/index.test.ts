import { describe, expect, test, vi } from "vitest";

import { createCli, createOtplibxCli, readStdin } from "./index.js";

describe("public entry point", () => {
  test("exposes the documented API", () => {
    expect(typeof createCli).toBe("function");
    expect(typeof createOtplibxCli).toBe("function");
    expect(typeof readStdin).toBe("function");
  });

  test("createCli returns a configured program without parsing argv", () => {
    const program = createCli();

    expect(program.name()).toBe("otplib");
    expect(program.commands.length).toBeGreaterThan(0);
  });

  test("createOtplibxCli returns a configured program without parsing argv", () => {
    const program = createOtplibxCli();

    expect(program.name()).toBe("otplibx");
  });

  // Guards the packaging split: `main` must resolve to this module, never to the
  // bin wrappers, which call parseAsync(process.argv) at import time.
  test("importing the entry point does not run a CLI", async () => {
    const originalArgv = process.argv;
    const originalExitCode = process.exitCode;
    const exit = vi.spyOn(process, "exit").mockImplementation((() => undefined) as never);

    process.argv = ["node", "host-app", "--a-flag-otplib-does-not-know"];

    try {
      vi.resetModules();
      await import("./index.js");

      expect(exit).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(originalExitCode);
    } finally {
      process.argv = originalArgv;
      process.exitCode = originalExitCode;
      exit.mockRestore();
    }
  });
});
