import { createOtplibxCli } from "./index.js";

createOtplibxCli()
  .parseAsync(process.argv)
  .catch((err) => {
    console.error(`error: ${err.message}`);
    process.exitCode = 1;
  });
