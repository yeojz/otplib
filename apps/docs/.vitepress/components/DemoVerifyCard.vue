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
          <span v-if="delta === 0 || delta === null" class="icon-check-circle"></span>
          <span v-else class="icon-warning"></span>
          <span>Valid!</span>
        </div>
        <div class="sync-info" v-if="delta !== null">
            <slot name="match-info" :delta="delta">
                Matched at {{ delta > 0 ? '+' : '' }}{{ delta }}
            </slot>
        </div>
      </div>

      <div v-else-if="isValid === false" class="result invalid">
        <div class="result-content">
          <span class="icon-x-circle"></span>
          <span>Invalid</span>
        </div>
      </div>
    </div>

    <div class="server-explanation">
      <slot name="explanation"></slot>
    </div>
  </div>
</template>
