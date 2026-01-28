import fs from "node:fs";

import { Command } from "commander";

import { generateOtp, verifyOtp } from "./otp/generate.js";
import { findEntry, parseAddInput, parseDotenvxInput, updateHotpCounter } from "./parse.js";
import { ansi, copyToClipboard, selectFromList } from "./tui/index.js";
import { formatOutput, generateUid, getLabel } from "./types.js";

import type { HotpData, OtpPayload } from "./types.js";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf-8").trim();
}

const program = new Command();

program.name("otplib-cli").description("Stateless OTP CLI for use with dotenvx").version("0.2.0");

// add command
program
  .command("add")
  .description("Add a new OTP entry (reads otpauth URI or JSON from stdin)")
  .option("--save-uid <file>", "Append generated UID to file")
  .action(async (options: { saveUid?: string }) => {
    const raw = await readStdin();
    if (!raw) {
      console.error("Error: Expected otpauth URI or JSON from stdin");
      console.error("Usage: echo 'otpauth://totp/GitHub:user?secret=ABC' | otplib-cli add");
      console.error(
        '       echo \'{"secret":"ABC","issuer":"GitHub","account":"user"}\' | otplib-cli add',
      );
      process.exitCode = 1;
      return;
    }

    try {
      const data = parseAddInput(raw);
      const uid = generateUid();
      const payload: OtpPayload = { data };
      const output = formatOutput(uid, payload);

      // Output the entry first (ensures it's not lost even if save-uid fails)
      process.stdout.write(output);

      if (options.saveUid) {
        try {
          const fd = fs.openSync(options.saveUid, "a", 0o600);
          fs.writeSync(fd, uid + "\n");
          fs.closeSync(fd);
        } catch (err) {
          console.error(
            `\nWarning: Could not save UID to ${options.saveUid}: ${(err as Error).message}`,
          );
          process.exitCode = 1;
        }
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

// list command
program
  .command("list")
  .description("Interactive list/search of OTP entries (reads JSON from stdin)")
  .action(async () => {
    const raw = await readStdin();
    if (!raw) {
      console.error("Error: Expected JSON from stdin");
      console.error("Usage: dotenvx get --all -f .secrets.otp | otplib-cli list");
      process.exitCode = 1;
      return;
    }

    try {
      const entries = parseDotenvxInput(raw);

      if (entries.length === 0) {
        console.log("No entries");
        return;
      }

      // Non-interactive mode if not TTY
      if (!process.stdin.isTTY) {
        for (const entry of entries) {
          const label = getLabel(entry.payload.data);
          process.stdout.write(`${entry.id}\t${entry.payload.data.type}\t${label}\n`);
        }
        return;
      }

      // Interactive mode
      const result = await selectFromList({
        items: entries,
        renderItem: (entry, selected) => {
          const label = getLabel(entry.payload.data);
          const type = entry.payload.data.type;
          const id = selected
            ? `${ansi.fg.cyan}${entry.id}${ansi.reset}`
            : `${ansi.dim}${entry.id}${ansi.reset}`;
          return `${id}  ${type}  ${label}`;
        },
        filterItem: (entry, query) => {
          const q = query.toLowerCase();
          const label = getLabel(entry.payload.data).toLowerCase();
          return label.includes(q) || entry.id.toLowerCase().includes(q);
        },
      });

      if (result.action === "cancel") {
        console.log("Cancelled");
        return;
      }

      if (result.action === "copy-uid") {
        if (copyToClipboard(result.item.id)) {
          console.log(`Copied UID: ${result.item.id}`);
        } else {
          process.stdout.write(result.item.id + "\n");
          console.error("Warning: Could not copy to clipboard");
        }
        return;
      }

      if (result.action === "copy-otp") {
        const code = await generateOtp(result.item.payload.data);
        if (copyToClipboard(code)) {
          console.log(`Copied OTP for ${getLabel(result.item.payload.data)}`);
        } else {
          process.stdout.write(code + "\n");
          console.error("Warning: Could not copy to clipboard");
        }
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

// totp command group
const totpCmd = program.command("totp").description("TOTP commands");

totpCmd
  .command("token")
  .description("Generate TOTP token")
  .argument("<id>", "Entry ID")
  .action(async (id: string) => {
    const raw = await readStdin();
    if (!raw) {
      console.error("Error: Expected JSON from stdin");
      console.error("Usage: dotenvx get --all -f .secrets.otp | otplib-cli totp token <id>");
      process.exitCode = 1;
      return;
    }

    try {
      const entries = parseDotenvxInput(raw);
      const entry = findEntry(entries, id);

      if (!entry) {
        console.error(`Error: Entry not found: ${id}`);
        process.exitCode = 1;
        return;
      }

      if (entry.payload.data.type !== "totp") {
        console.error(`Error: Entry ${id} is HOTP, not TOTP`);
        process.exitCode = 1;
        return;
      }

      const code = await generateOtp(entry.payload.data);
      process.stdout.write(code);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

// hotp command group
const hotpCmd = program.command("hotp").description("HOTP commands");

hotpCmd
  .command("token")
  .description("Generate HOTP token")
  .argument("<id>", "Entry ID")
  .action(async (id: string) => {
    const raw = await readStdin();
    if (!raw) {
      console.error("Error: Expected JSON from stdin");
      console.error("Usage: dotenvx get --all -f .secrets.otp | otplib-cli hotp token <id>");
      process.exitCode = 1;
      return;
    }

    try {
      const entries = parseDotenvxInput(raw);
      const entry = findEntry(entries, id);

      if (!entry) {
        console.error(`Error: Entry not found: ${id}`);
        process.exitCode = 1;
        return;
      }

      if (entry.payload.data.type !== "hotp") {
        console.error(`Error: Entry ${id} is TOTP, not HOTP`);
        process.exitCode = 1;
        return;
      }

      const code = await generateOtp(entry.payload.data);
      process.stdout.write(code);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

hotpCmd
  .command("update-counter")
  .description("Output updated HOTP entry with new counter")
  .argument("<id>", "Entry ID")
  .argument("[n]", "New counter value (default: current + 1)")
  .action(async (id: string, n?: string) => {
    const raw = await readStdin();
    if (!raw) {
      console.error("Error: Expected JSON from stdin");
      console.error(
        "Usage: dotenvx get --all -f .secrets.otp | otplib-cli hotp update-counter <id> | dotenvx set -f .secrets.otp",
      );
      process.exitCode = 1;
      return;
    }

    try {
      const entries = parseDotenvxInput(raw);
      const entry = findEntry(entries, id);

      if (!entry) {
        console.error(`Error: Entry not found: ${id}`);
        process.exitCode = 1;
        return;
      }

      if (entry.payload.data.type !== "hotp") {
        console.error(`Error: Entry ${id} is TOTP, not HOTP`);
        process.exitCode = 1;
        return;
      }

      let newCounter: number | undefined;
      if (n !== undefined) {
        newCounter = parseInt(n, 10);
        if (isNaN(newCounter) || newCounter < 0) {
          console.error("Error: Counter must be a non-negative integer");
          process.exitCode = 1;
          return;
        }
      }

      const updatedData = updateHotpCounter(entry.payload.data as HotpData, newCounter);
      const payload: OtpPayload = { data: updatedData };
      const output = formatOutput(id, payload);
      process.stdout.write(output);
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

// verify command
program
  .command("verify")
  .description("Verify a token against an entry")
  .argument("<id>", "Entry ID")
  .argument("<token>", "Token to verify (6-8 digits)")
  .action(async (id: string, token: string) => {
    const raw = await readStdin();
    if (!raw) {
      console.error("Error: Expected JSON from stdin");
      console.error("Usage: dotenvx get --all -f .secrets.otp | otplib-cli verify <id> <token>");
      process.exitCode = 1;
      return;
    }

    try {
      const entries = parseDotenvxInput(raw);
      const entry = findEntry(entries, id);

      if (!entry) {
        console.error(`Error: Entry not found: ${id}`);
        process.exitCode = 1;
        return;
      }

      const valid = await verifyOtp(entry.payload.data, token);
      if (!valid) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exitCode = 1;
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
});
