import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import BenchmarkTable from "../components/BenchmarkTable.vue";
import TOTPDemo from "../components/TOTPDemo.vue";
import HOTPDemo from "../components/HOTPDemo.vue";
import "./custom.css";
import "./demo-common.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("BenchmarkTable", BenchmarkTable);
    app.component("TOTPDemo", TOTPDemo);
    app.component("HOTPDemo", HOTPDemo);
  },
} satisfies Theme;
