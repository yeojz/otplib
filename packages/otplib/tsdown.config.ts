import { browserBundleConfig, libraryConfigs } from "@repo/build-config";

export default [
  ...libraryConfigs({
    index: "src/index.ts",
    functional: "src/functional.ts",
    class: "src/class.ts",
  }),
  browserBundleConfig({ index: "src/index.ts" }, "otplib"),
];
