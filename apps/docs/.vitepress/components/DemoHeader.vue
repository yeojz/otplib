<script setup>
defineProps({
  title: String,
  description: String
})
</script>

<template>
  <div class="demo-header">
    <h2 class="title">{{ title }}</h2>
    <p v-if="description" class="description">{{ description }}</p>
  </div>
</template>

<style scoped>
.demo-header {
  text-align: left;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--vp-c-brand);
  margin: 0 0 0.5rem;
  border-top: none;
  padding: 0;
  letter-spacing: -0.02em;
}

.description {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin: 0;
  max-width: 100%;
  line-height: 1.5;
}
</style>
