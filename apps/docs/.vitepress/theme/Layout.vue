<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { useRoute, useData } from "vitepress";
import { watchEffect, ref } from "vue";

const { Layout } = DefaultTheme;
const route = useRoute();
const { isDark } = useData();

// Pages where dark mode is forced and toggle is hidden
const forceDarkPages = ["/", "/tools/cli", "/tools/cli.html"];

// Store user's preference when entering a forced-dark page
const savedPreference = ref<boolean | null>(null);

watchEffect(() => {
  if (typeof document !== "undefined") {
    const isForcedDark = forceDarkPages.some(
      (p) => route.path === p || route.path === p.replace(".html", ""),
    );

    document.documentElement.classList.toggle("hide-appearance-toggle", isForcedDark);

    if (isForcedDark) {
      // Save current preference and force dark mode
      if (savedPreference.value === null) {
        savedPreference.value = isDark.value;
      }
      isDark.value = true;
    } else if (savedPreference.value !== null) {
      // Restore user preference when leaving forced-dark pages
      isDark.value = savedPreference.value;
      savedPreference.value = null;
    }
  }
});
</script>

<template>
  <Layout />
</template>
