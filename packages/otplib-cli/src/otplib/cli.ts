import { createCli } from "./index.js";

createCli()
  .parseAsync(process.argv)
  .catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  });
