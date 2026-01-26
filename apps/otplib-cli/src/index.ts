import os from "node:os";
import path from "node:path";
import readline from "node:readline";

import { parseArgs } from "./cli/args.js";
import {
  addEntry,
  createCommandContext,
  getOtp,
  listEntries,
  removeEntry,
  type AddEntryInput,
} from "./cli/commands.js";
import { ansi, copyToClipboard, selectFromList } from "./tui/index.js";
import { resolveVaultName } from "./vault/resolve.js";

import type { OtpAlgorithm, OtpDigits } from "./vault/format.js";

function getConfigRoot(): string {
  const platform = process.platform;
  if (platform === "win32") {
    return path.join(process.env.APPDATA || os.homedir(), "otplib-cli");
  }
  if (platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "otplib-cli");
  }
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "otplib-cli");
}

async function promptPassphrase(): Promise<string> {
  const envPass = process.env.OTPLIB_PASSPHRASE;
  if (envPass) {
    return envPass;
  }

  if (!process.stdin.isTTY) {
    throw new Error("Passphrase required. Set OTPLIB_PASSPHRASE env var for non-TTY usage.");
  }

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    process.stdout.write("Passphrase: ");
    rl.question("", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8").trim();
}

type AddEntryJsonInput = {
  secret: string;
  label: string;
  type?: "totp" | "hotp";
  issuer?: string;
  digits?: number;
  algorithm?: string;
  period?: number;
  counter?: number;
};

function parseAddEntryJson(raw: string): AddEntryInput {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON input");
  }

  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("Invalid JSON input: expected an object");
  }

  const input = json as AddEntryJsonInput;

  if (typeof input.secret !== "string" || !input.secret) {
    throw new Error("Missing required field: secret");
  }
  if (typeof input.label !== "string" || !input.label) {
    throw new Error("Missing required field: label");
  }

  const type = input.type ?? "totp";
  if (type !== "totp" && type !== "hotp") {
    throw new Error('Invalid type, expected "totp" or "hotp"');
  }

  const digits = (input.digits ?? 6) as OtpDigits;
  if (digits !== 6 && digits !== 7 && digits !== 8) {
    throw new Error("Invalid digits, expected 6, 7, or 8");
  }

  const algorithm = (input.algorithm ?? "sha1") as OtpAlgorithm;
  if (algorithm !== "sha1" && algorithm !== "sha256" && algorithm !== "sha512") {
    throw new Error('Invalid algorithm, expected "sha1", "sha256", or "sha512"');
  }

  if (type === "totp") {
    const period = input.period ?? 30;
    if (typeof period !== "number" || period <= 0) {
      throw new Error("Invalid period, expected a positive number");
    }
    return {
      label: input.label,
      issuer: input.issuer,
      type: "totp",
      secret: input.secret,
      digits,
      algorithm,
      period,
    };
  } else {
    const counter = input.counter ?? 0;
    if (typeof counter !== "number" || counter < 0) {
      throw new Error("Invalid counter, expected a non-negative number");
    }
    return {
      label: input.label,
      issuer: input.issuer,
      type: "hotp",
      secret: input.secret,
      digits,
      algorithm,
      counter,
    };
  }
}

function printHelp(): void {
  process.stdout.write("otplib-cli - Manage encrypted OTP vaults\n");
  process.stdout.write("\nUsage: otplib-cli [command] [options] [args]\n");
  process.stdout.write("\nCommands:\n");
  process.stdout.write("  add                   Add a new OTP entry (reads JSON from stdin)\n");
  process.stdout.write("  list                  List entries (interactive filter in TTY)\n");
  process.stdout.write("  remove <id>           Remove an entry\n");
  process.stdout.write("  get <id>              Generate OTP code\n");
  process.stdout.write("\nOptions:\n");
  process.stdout.write("  -h, --help            Show help\n");
  process.stdout.write("  -V, --version         Show version\n");
  process.stdout.write("  -v, --vault <name>    Specify vault name (default: 'default')\n");
  process.stdout.write("\nEnvironment:\n");
  process.stdout.write("  OTPLIB_VAULT          Default vault name\n");
  process.stdout.write("  OTPLIB_PASSPHRASE     Vault passphrase (for non-TTY usage)\n");
  process.stdout.write("\nAdd command JSON format:\n");
  process.stdout.write('  echo \'{"secret":"ABC","label":"GitHub"}\' | otplib-cli add\n');
  process.stdout.write("\n  Required: secret, label\n");
  process.stdout.write("  Optional: type (totp|hotp), issuer, digits (6|7|8),\n");
  process.stdout.write("            algorithm (sha1|sha256|sha512), period, counter\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  if (args.version) {
    process.stdout.write("0.0.1\n");
    return;
  }

  if (!args.command) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const configRoot = getConfigRoot();
  const vaultName = resolveVaultName({
    vaultFlag: args.vault,
    envVault: process.env.OTPLIB_VAULT,
  });

  const passphrase = await promptPassphrase();
  const ctx = createCommandContext({ configRoot, vaultName, passphrase });

  switch (args.command) {
    case "add": {
      const raw = await readStdin();
      if (!raw) {
        process.stderr.write("Error: Expected JSON input from stdin\n");
        process.stderr.write(
          'Usage: echo \'{"secret":"ABC","label":"GitHub"}\' | otplib-cli add\n',
        );
        process.exitCode = 1;
        return;
      }
      const input = parseAddEntryJson(raw);
      const id = await addEntry(ctx, input);
      process.stdout.write(`${id}\n`);
      break;
    }

    case "list": {
      const entries = await listEntries(ctx);
      if (entries.length === 0) {
        process.stdout.write("No entries\n");
        break;
      }

      // Non-interactive mode if not TTY
      if (!process.stdin.isTTY) {
        for (const entry of entries) {
          const issuer = entry.issuer ? ` (${entry.issuer})` : "";
          process.stdout.write(`${entry.id}\t${entry.label}${issuer}\n`);
        }
        break;
      }

      // Interactive mode
      const result = await selectFromList({
        items: entries,
        renderItem: (entry, selected) => {
          const issuer = entry.issuer ? ` ${ansi.dim}(${entry.issuer})${ansi.reset}` : "";
          const id = selected
            ? `${ansi.fg.cyan}${entry.id}${ansi.reset}`
            : `${ansi.dim}${entry.id}${ansi.reset}`;
          return `${id}  ${entry.label}${issuer}`;
        },
        filterItem: (entry, query) => {
          const q = query.toLowerCase();
          return (
            entry.label.toLowerCase().includes(q) ||
            entry.id.toLowerCase().includes(q) ||
            (entry.issuer?.toLowerCase().includes(q) ?? false)
          );
        },
      });

      if (result.action === "cancel") {
        process.stdout.write("Cancelled\n");
        break;
      }

      if (result.action === "copy-uid") {
        if (copyToClipboard(result.item.id)) {
          process.stdout.write(`Copied UID: ${result.item.id}\n`);
        } else {
          process.stdout.write(`${result.item.id}\n`);
          process.stderr.write("Warning: Could not copy to clipboard\n");
        }
        break;
      }

      if (result.action === "copy-otp") {
        const code = await getOtp(ctx, result.item.id);
        if (copyToClipboard(code)) {
          process.stdout.write(`Copied OTP for ${result.item.label}\n`);
        } else {
          process.stdout.write(`${code}\n`);
          process.stderr.write("Warning: Could not copy to clipboard\n");
        }
        break;
      }
      break;
    }

    case "remove": {
      const [id] = args.args;
      if (!id) {
        process.stderr.write("Usage: otplib-cli remove <id>\n");
        process.exitCode = 1;
        return;
      }
      await removeEntry(ctx, id);
      process.stdout.write("Removed\n");
      break;
    }

    case "get": {
      const [id] = args.args;
      if (!id) {
        process.stderr.write("Usage: otplib-cli get <id>\n");
        process.exitCode = 1;
        return;
      }
      const code = await getOtp(ctx, id);
      process.stdout.write(`${code}\n`);
      break;
    }

    default:
      process.stderr.write(`Unknown command: ${args.command}\n`);
      process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${err.message}\n`);
  process.exitCode = 1;
});
