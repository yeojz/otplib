import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/.vitepress/cache/**",
      "apps/benchmarks/**",
    ],
  },
  {
    // Config files that don't need TypeScript project service
    files: [
      "tsup.config.ts",
      "vitest.config.ts",
      "packages/**/tsup.config.ts",
      "packages/**/vitest.config.ts",
      "apps/**/tsup.config.ts",
      "apps/**/vitest.config.ts",
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
    },
  },
  {
    // All other TypeScript files with TypeScript project service
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "tsup.config.ts",
      "vitest.config.ts",
      "packages/**/tsup.config.ts",
      "packages/**/vitest.config.ts",
      "apps/**/tsup.config.ts",
      "apps/**/vitest.config.ts",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/.vitepress/**",
    ],
    plugins: {
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      parser: tseslint.parser,
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./packages/*/tsconfig.json",
          "./apps/*/tsconfig.json",
          "./internal/*/tsconfig.json",
        ],
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-console": "off",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            ["parent", "sibling"],
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
    },
  },
];
