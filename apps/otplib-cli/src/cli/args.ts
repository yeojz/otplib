export type ParsedArgs = {
  help: boolean;
  version: boolean;
  vault?: string;
  command?: string;
  args: string[];
};

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    help: false,
    version: false,
    args: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--version" || arg === "-V") {
      result.version = true;
    } else if (arg === "--vault" || arg === "-v") {
      result.vault = argv[++i];
    } else if (!result.command && !arg.startsWith("-")) {
      result.command = arg;
    } else if (!arg.startsWith("-")) {
      result.args.push(arg);
    }
  }

  return result;
}
