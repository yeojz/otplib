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
/* TOTP-specific styles - Cipher Terminal aesthetic */
.token-card {
  text-align: center;
}

.token-display {
  margin-bottom: 1rem;
}

.tokens {
  background: var(--cipher-surface);
  border: 1px solid var(--cipher-grid-color);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
  min-height: 240px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

/* Scan line effect */
.tokens::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--cipher-accent) 50%,
    transparent 100%
  );
  animation: scan 4s linear infinite;
  opacity: 0.4;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.token-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.current-token {
  background: var(--cipher-accent);
  box-shadow: 0 0 24px var(--cipher-accent-glow),
    0 4px 16px rgba(0, 0, 0, 0.2);
}

.outer-token {
  background: var(--vp-c-bg);
  border: 1px solid var(--cipher-grid-color);
  transform: scale(0.92);
  opacity: 0.7;
}

.token-value {
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  letter-spacing: 0.25em;
}

.current-token .token-value {
  font-size: 2rem;
  color: #0a1419;
}

.outer-token .token-value {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
}

.token-label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: var(--cipher-surface);
  border: 1px solid var(--cipher-grid-color);
  color: var(--vp-c-text-3);
  letter-spacing: 0.05em;
}

.timer-bar {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  letter-spacing: 0.02em;
}

.time-text {
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.progress {
  height: 4px;
  background: var(--cipher-surface);
  border: 1px solid var(--cipher-grid-color);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cipher-accent) 0%, var(--vp-c-brand-2) 100%);
  box-shadow: 0 0 8px var(--cipher-accent-glow);
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .current-token .token-value {
    font-size: 1.75rem;
  }

  .outer-token .token-value {
    font-size: 0.95rem;
  }

  .tokens {
    min-height: 220px;
    padding: 1rem;
  }
}
</style>
