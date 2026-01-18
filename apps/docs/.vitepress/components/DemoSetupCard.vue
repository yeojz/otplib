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
        <span v-else class="icon-gear"></span>
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
