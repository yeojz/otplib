<script setup>
import { ref, onMounted } from "vue";

const data = ref(null);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const res = await fetch("/benchmarks.json");
    if (!res.ok) throw new Error("Failed to load benchmarks");
    data.value = await res.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="benchmark-container">
    <div v-if="loading">Loading benchmarks...</div>
    <div v-else-if="error">
      Failed to load benchmark data. Run
      <code>pnpm --filter @repo/benchmarks generate-data</code> to generate it.
    </div>
    <div v-else>
      <p>
        <strong>Captured:</strong> {{ new Date(data.timestamp).toLocaleString() }}<br />
        <strong>Environment:</strong> {{ data.platform }}, Node.js {{ data.nodeVersion }}
      </p>

      <table>
        <thead>
          <tr>
            <th>Operation</th>
            <th>Ops/sec</th>
            <th>Avg Latency (μs)</th>
            <th>Samples</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.results" :key="row.name">
            <td>{{ row.name }}</td>
            <td>{{ row.opsPerSec.toLocaleString() }}</td>
            <td>{{ row.avgLatencyUs.toFixed(2) }}</td>
            <td>{{ row.samples }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.benchmark-container {
  margin: 2rem 0;
}
</style>
