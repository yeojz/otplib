import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import BenchmarkTable from "../components/BenchmarkTable.vue";
import TOTPDemo from "../components/TOTPDemo.vue";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("BenchmarkTable", BenchmarkTable);
    app.component("TOTPDemo", TOTPDemo);
  },
} satisfies Theme;
