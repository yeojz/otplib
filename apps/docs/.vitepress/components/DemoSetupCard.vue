<script setup>
import { ref } from 'vue'

const props = defineProps({
  issuer: String,
  label: String,
  secret: String,
  qrCodeUrl: String
})

const emit = defineEmits(['update:issuer', 'update:label', 'generate-new-secret'])

const showConfig = ref(false)
const showSecret = ref(false)
</script>

<template>
  <div class="card qr-config-card">
    <div class="card-header">
      <h3>Setup</h3>
      <button :class="showConfig ? 'btn-save' : 'gear-icon'" @click="showConfig = !showConfig" title="Configuration"
        aria-label="Configuration">
        <span v-if="showConfig">Save</span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z">
          </path>
        </svg>
      </button>
    </div>

    <div v-if="showConfig" class="config-panel">
      <div class="form-group">
        <label>Issuer</label>
        <input :value="issuer" @input="$emit('update:issuer', $event.target.value)" type="text" />
      </div>
      <div class="form-group">
        <label>Label</label>
        <input :value="label" @input="$emit('update:label', $event.target.value)" type="text" />
      </div>
      <!-- Slot for extra configuration (e.g. Counter) -->
      <slot name="extra-config"></slot>
    </div>

    <div v-if="!showConfig && qrCodeUrl" class="qr-wrapper">
      <img :src="qrCodeUrl" alt="QR Code" />

      <button class="btn-primary generate-secret-btn" @click="$emit('generate-new-secret')">
        Generate New Secret
      </button>

      <div class="secret-section">
        <button @click="showSecret = !showSecret" class="toggle-secret">
          {{ showSecret ? "Hide" : "Show" }} Secret
        </button>
        <div v-if="showSecret" class="secret-value">
          {{ secret }}
        </div>
      </div>
    </div>
  </div>
</template>
