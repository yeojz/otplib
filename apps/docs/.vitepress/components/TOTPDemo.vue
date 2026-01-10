<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { generate as totpGenerate, verify as totpVerify, generateSecret as generateSecretFn, generateURI } from 'otplib'

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
const showSecret = ref(false)
const showConfig = ref(false)
let intervalId = null

async function generateNewSecret() {
  // Use otplib's generateSecret with default plugins
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
      // Shift tokens and generate the new one
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
    // Use otplib's generateURI function
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
      epochTolerance: 30,
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
  // Initialize timeElapsed
  const now = Math.floor(Date.now() / 1000)
  timeElapsed.value = now % 30
  intervalId = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div class="totp-demo-container">
    <div class="card qr-config-card">
      <div class="card-header">
        <h3>Scan QR Code</h3>
        <button class="gear-icon" @click="showConfig = !showConfig" title="Configuration" aria-label="Configuration">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z">
            </path>
          </svg>
        </button>
      </div>

      <!-- Configuration Panel (Hidden by Default) -->
      <div v-if="showConfig" class="config-panel">
        <div class="form-group">
          <label>Issuer</label>
          <input v-model="issuer" type="text" @change="generateQR" />
        </div>
        <div class="form-group">
          <label>Label</label>
          <input v-model="label" type="text" @change="generateQR" />
        </div>
      </div>

      <!-- QR Code Display (Default View) -->
      <div v-if="!showConfig && qrCodeUrl" class="qr-wrapper">
        <img :src="qrCodeUrl" alt="TOTP QR Code" />

        <!-- Generate New Secret Button (Always Visible) -->


        <!-- Secret Section (Always Visible) -->
        <button class="btn-primary generate-secret-btn" @click="generateNewSecret">
          Generate New Secret
        </button>

        <div class="secret-section">
          <button @click="showSecret = !showSecret" class="toggle-secret">
            {{ showSecret ? 'Hide' : 'Show' }} Secret
          </button>
          <div v-if="showSecret" class="secret-value">
            {{ secret }}
          </div>
        </div>
      </div>

    </div>

    <div class="card token-card">
      <div class="card-header">
        <h3>Tokens</h3>
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

    <div class="card verify-card">
      <div class="card-header">
        <h3>Verify Token</h3>
      </div>
      <div>
        <div class="verify-form">
          <input v-model="userInput" type="text" placeholder="Enter 6-digit code" maxlength="6"
            @keyup.enter="verifyToken" />
          <button class="btn-verify" @click="verifyToken">Verify</button>
        </div>
        <div v-if="isValid === true" :class="['result', delta === 0 ? 'valid' : 'warning']">
          <div class="result-content">
            <svg v-if="delta === 0" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>{{ delta === 0 ? 'Token is valid!' : 'Token is valid (from different time period)' }}</span>
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
            <span>Token is invalid</span>
          </div>
        </div>
        <div v-if="delta" class="delta-info">
          {{ delta < 0 ? `${delta} period` : `+${delta} period` }} </div>
        </div>
      </div>
    </div>
</template>

<style scoped>
.totp-demo-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  align-items: stretch;
}

.card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  min-height: 350px;
}

.card>*:not(.card-header) {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.gear-icon {
  background: none;
  border: none;
  color: var(--vp-c-text-2);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
}

.gear-icon:hover {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.config-panel {
  margin-bottom: 1rem;
}

h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

input[type="text"] {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

input[type="text"]:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

.btn-primary {
  width: 100%;
  padding: 0.625rem 1rem;
  background: var(--vp-button-brand-bg);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.qr-wrapper img {
  border: 4px solid white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  ;
}

.secret-section {
  text-align: center;
}

.toggle-secret {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.5rem;
}

.secret-value {
  margin-top: 0.5rem;
  padding: 1rem 3rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  font-weight: bold;
  word-break: break-all;
}

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

.verify-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.verify-form input {
  flex: 1;
}

.btn-verify {
  padding: 0.625rem 1rem;
  background: var(--vp-button-brand-bg);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-verify:hover {
  opacity: 0.9;
}

.result {
  padding: 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.875rem;
}

.result-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.result-content svg {
  flex-shrink: 0;
}

.result.valid {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid #10b981;
}

.result.invalid {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid #ef4444;
}

.result.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid #f59e0b;
}

.delta-info {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 400;
  opacity: 0.8;
  text-align: center;
}

@media (max-width: 768px) {
  .totp-demo-container {
    grid-template-columns: 1fr;
  }

  .qr-config-card {
    grid-row: span 1;
    min-height: 350px;
  }

  .card {
    min-height: auto;
  }

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
