<script setup>
const props = defineProps({
  userInput: String,
  isValid: {
    type: Boolean,
    default: null
  },
  delta: {
    type: Number,
    default: null
  },
  serverCounter: { // Optional, for display
    type: [Number, String],
    default: undefined
  }
})

const emit = defineEmits(['update:userInput', 'verify'])
</script>

<template>
  <div class="card verify-card">
    <div class="card-header">
      <h3>Server (Verify)</h3>
    </div>

    <div v-if="serverCounter !== undefined" class="server-status">
      <div class="counter-label">Expected Counter: {{ serverCounter }}</div>
    </div>
    
    <!-- Slot for other server status if needed (e.g. Timer for TOTP, though TOTP uses separate card usually. 
         Wait, TOTP verify doesn't show expected counter. But maybe it could? No, it's time based.) -->
    <slot name="server-status"></slot>

    <div class="verify-section">
      <div class="verify-form">
        <input :value="userInput" @input="$emit('update:userInput', $event.target.value)" type="text"
          placeholder="Enter code" maxlength="6" @keyup.enter="$emit('verify')" />
        <button class="btn-verify" @click="$emit('verify')">Verify</button>
      </div>

      <div v-if="isValid === true" :class="['result', (delta === 0 || delta === null) ? 'valid' : 'warning']">
        <div class="result-content">
          <svg v-if="delta === 0 || delta === null" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Valid!</span>
        </div>
        <!-- Use slot for specific sync/match info, or default based on delta -->
        <div class="sync-info" v-if="delta !== null">
            <slot name="match-info" :delta="delta">
                Matched at {{ delta > 0 ? '+' : '' }}{{ delta }}
            </slot>
        </div>
      </div>

      <div v-else-if="isValid === false" class="result invalid">
        <div class="result-content">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <span>Invalid</span>
        </div>
      </div>
    </div>

    <div class="server-explanation">
      <slot name="explanation"></slot>
    </div>
  </div>
</template>
