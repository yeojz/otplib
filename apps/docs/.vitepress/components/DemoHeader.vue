<script setup>
defineProps({
  title: String,
  description: String
})
</script>

<template>
  <div class="demo-header">
    <div class="title-row">
      <span class="protocol-badge">{{ title }}</span>
      <span class="status-dot"></span>
    </div>
    <p v-if="description" class="description">{{ description }}</p>
  </div>
</template>

<style scoped>
.demo-header {
  text-align: left;
  margin-bottom: 2rem;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.protocol-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--cipher-accent);
  letter-spacing: 0.05em;
  text-shadow: 0 0 20px var(--cipher-accent-glow);
}

.status-dot {
  width: 10px;
  height: 10px;
  background: var(--cipher-accent);
  border-radius: 50%;
  box-shadow: 0 0 12px var(--cipher-accent-glow);
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.9);
  }
}

.description {
  font-family: var(--vp-font-family-base);
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  margin: 0;
  max-width: 100%;
  line-height: 1.6;
}
</style>
