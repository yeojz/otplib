import { defineConfig } from "vitepress";
import { resolve } from "path";
import typedocSidebar from "../api/typedoc-sidebar.json";

export default defineConfig({
  title: "otplib",
  description: "Pluggable One Time Password library for TypeScript",

  ignoreDeadLinks: true,
  appearance: "force-dark",

  // Configure Vite to resolve workspace packages
  vite: {
    resolve: {
      alias: {
        "@otplib/core": resolve(__dirname, "../../../packages/core/dist/index.js"),
        "@otplib/hotp": resolve(__dirname, "../../../packages/hotp/dist/index.js"),
        "@otplib/plugin-crypto-web": resolve(
          __dirname,
          "../../../packages/plugin-crypto-web/dist/index.js",
        ),
        "@otplib/plugin-base32-scure": resolve(
          __dirname,
          "../../../packages/plugin-base32-scure/dist/index.js",
        ),
        "@otplib/totp": resolve(__dirname, "../../../packages/totp/dist/index.js"),
        "@otplib/uri": resolve(__dirname, "../../../packages/uri/dist/index.js"),
      },
    },
  },

  themeConfig: {
    logo: {
      light: "/assets/otplib-b.svg",
      dark: "/assets/otplib-w.svg",
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
    },

    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "CLI", link: "/tools/cli" },
      { text: "API", link: "/api/packages" },
    ],

    sidebar: [
      {
        text: "Guide",
        collapsed: false,
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Advanced Usage", link: "/guide/advanced-usage" },
          { text: "Plugins", link: "/guide/plugins" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
        ],
      },
      {
        text: "Apps / Tools",
        collapsed: false,
        items: [{ text: "Command Line (CLI)", link: "/guide/cli-tool.md" }],
      },
      {
        text: "Other Topics",
        collapsed: false,
        items: [
          { text: "Testing", link: "/guide/testing" },
          { text: "Security Considerations", link: "/guide/security" },
          { text: "Danger Zone", link: "/guide/danger-zone" },
          { text: "Runtime Compatibility", link: "/guide/runtime-compatibility" },
          { text: "RFC Implementations", link: "/guide/rfc-implementations" },
          { text: "Fuzz Tests", link: "/guide/fuzz-tests" },
          { text: "Benchmarks", link: "/guide/benchmarks" },
        ],
      },
      {
        text: "Migrations",
        collapsed: false,
        items: [
          { text: "Migrating v11 to v13", link: "/guide/v11-adapter.md" },
          { text: "Migrating v12 to v13", link: "/guide/v12-adapter.md" },
        ],
      },
      {
        text: "API Reference",
        collapsed: false,
        items: typedocSidebar,
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/yeojz/otplib" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: `Copyright © ${new Date().getFullYear()} <a href="https://github.com/yeojz">@yeojz</a>`,
    },
  },
});
