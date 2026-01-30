import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import BenchmarkTable from "../components/BenchmarkTable.vue";
import TOTPDemo from "../components/TOTPDemo.vue";
import HOTPDemo from "../components/HOTPDemo.vue";
import DemoHeader from "../components/DemoHeader.vue";
import CLIShowcase from "../components/CLIShowcase.vue";
import "./custom.css";
import "./demo-common.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("BenchmarkTable", BenchmarkTable);
    app.component("TOTPDemo", TOTPDemo);
    app.component("HOTPDemo", HOTPDemo);
    app.component("DemoHeader", DemoHeader);
    app.component("CLIShowcase", CLIShowcase);
  },
} satisfies Theme;
