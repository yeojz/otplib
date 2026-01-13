<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { generate as totpGenerate, verify as totpVerify, generateSecret as generateSecretFn, generateURI } from 'otplib'
import DemoSetupCard from "./DemoSetupCard.vue";
import DemoVerifyCard from "./DemoVerifyCard.vue";

const issuer = ref('DemoApp')
const label = ref('user@example.com')
const secret = ref('')
const token = ref('')
const tokens = ref([])
const userInput = ref('')
const isValid = ref(null)
const delta = ref(null)
const qrCodeUrl = ref('')
const timeElapsed = ref(0)
let intervalId = null

async function generateNewSecret() {
  secret.value = generateSecretFn()

  await generateQR()
  await updateToken(true)

  isValid.value = null
  userInput.value = ''
  delta.value = null

  const now = Math.floor(Date.now() / 1000)
  timeElapsed.value = now % 30
}

async function updateToken(resetPrevious = false) {
  if (!secret.value) return
  try {
    const now = Math.floor(Date.now() / 1000)

    if (tokens.value.length === 0 || resetPrevious) {
      for (let i = -1; i <= 1; i++) {
        const tempToken = await totpGenerate({
          secret: secret.value,
          epoch: now + (i * 30),
        })
        tokens.value[i + 1] = tempToken
      }
    } else {
      tokens.value.shift()
      const newToken = await totpGenerate({
        secret: secret.value,
        epoch: now + (1 * 30),
      })
      tokens.value.push(newToken)
    }

  } catch (e) {
    console.error('Token generation error:', e)
    token.value = 'ERROR'
  }
}

async function generateQR() {
  if (!secret.value) return
  try {
    const uri = generateURI({
      issuer: issuer.value,
      label: label.value,
      secret: secret.value,
    })

    qrCodeUrl.value = await QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' }
    })
  } catch (e) {
    console.error('QR generation error:', e)
  }
}

async function verifyToken() {
  if (!userInput.value || !tokens.value[2]) {
    isValid.value = null
    delta.value = null
    return
  }

  try {
    const result = await totpVerify({
      secret: secret.value,
      token: userInput.value,
      epoch: Math.floor(Date.now() / 1000),
      epochTolerance: 30, // Large tolerance for demo
    })

    isValid.value = result.valid
    delta.value = result.delta
  } catch (e) {
    console.error('Verification error:', e)
    isValid.value = false
    delta.value = null
  }
}

function updateTimer() {
  const now = Math.floor(Date.now() / 1000)
  timeElapsed.value = now % 30
  if (timeElapsed.value === 0) {
    updateToken()
  }
}

onMounted(() => {
  generateNewSecret()
  const now = Math.floor(Date.now() / 1000)
  timeElapsed.value = now % 30
  intervalId = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div class="totp-demo-container demo-container">
    <DemoSetupCard
      v-model:issuer="issuer"
      v-model:label="label"
      :secret="secret"
      :qr-code-url="qrCodeUrl"
      @generate-new-secret="generateNewSecret"
    />

    <div class="card token-card">
      <div class="card-header">
        <h3>Client (Generate)</h3>
      </div>
      <div class="token-display">
        <div class="tokens">
          <div v-for="(token, index) in tokens" :key="`token-${index}-${token}`" :class="[
            'token-item',
            index === 1 ? 'current-token' : 'outer-token'
          ]">
            <span class="token-value">{{ token }}</span>
            <span v-if="index !== 1" class="token-label">{{
              index === 0 ? '−30s' : '+30s'
              }}</span>
          </div>
        </div>
      </div>

      <div class="timer-bar">
        <div class="time-text">Resets in: {{ 30 - timeElapsed }}s</div>
        <div class="progress">
          <div class="progress-fill" :style="{ width: (timeElapsed / 30 * 100) + '%' }"></div>
        </div>
      </div>
    </div>

    <DemoVerifyCard
      v-model:user-input="userInput"
      :is-valid="isValid"
      :delta="delta"
      @verify="verifyToken"
    >
      <template #match-info="{ delta }">
        Matched at period {{ delta > 0 ? '+' : '' }}{{ delta }}
      </template>
    </DemoVerifyCard>
  </div>
</template>

<style scoped>
/* Only TOTP-specific styles remain */
.token-card {
  text-align: center;
}

.token-display {
  margin-bottom: 1rem;
}

.tokens {
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  min-height: 240px;
  width: 100%;
}

.token-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
}

.current-token {
  background: var(--vp-button-brand-bg);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.outer-token {
  background: var(--vp-c-bg-soft);
  transform: scale(0.9);
}

.token-value {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.current-token .token-value {
  font-size: 2rem;
  color: white;
}

.outer-token .token-value {
  font-size: 1.2rem;
  color: var(--vp-c-text-2);
}

.token-label {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  color: var(--vp-c-text-2);
}

.timer-bar {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
}

.time-text {
  margin-bottom: 0.5rem;
}

.progress {
  height: 6px;
  background: var(--vp-c-bg);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--vp-button-brand-bg);
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .current-token .token-value {
    font-size: 1.8rem;
  }

  .outer-token .token-value {
    font-size: 1rem;
  }

  .tokens {
    min-height: 240px;
  }
}
</style>
