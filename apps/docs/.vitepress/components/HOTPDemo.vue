<script setup>
import { ref, onMounted } from "vue";
import QRCode from "qrcode";
import {
  generate as hotpGenerate,
  verify as hotpVerify,
  generateSecret as generateSecretFn,
  generateURI,
} from "otplib";

const issuer = ref("DemoApp");
const label = ref("user@example.com");
const secret = ref("");
const clientCounter = ref(0);
const serverCounter = ref(0);
const currentToken = ref("");
const userInput = ref("");
const isValid = ref(null);
const delta = ref(null);
const qrCodeUrl = ref("");
const showSecret = ref(false);
const showConfig = ref(false);
const setupCounter = ref(0);

async function updateSetupCounter() {
  const val = parseInt(setupCounter.value) || 0;
  clientCounter.value = val;
  serverCounter.value = val;
  await updateToken();
  await generateQR();

  isValid.value = null;
  userInput.value = "";
  delta.value = null;
}

async function generateNewSecret() {
  secret.value = generateSecretFn();
  setupCounter.value = 0;
  clientCounter.value = 0;
  serverCounter.value = 0;

  await updateToken();
  await generateQR();

  isValid.value = null;
  userInput.value = "";
  delta.value = null;
}

async function updateToken() {
  if (!secret.value) return;
  try {
    currentToken.value = await hotpGenerate({
      secret: secret.value,
      strategy: "hotp",
      counter: clientCounter.value,
    });
  } catch (e) {
    console.error("Token generation error:", e);
    currentToken.value = "ERROR";
  }
}

async function incrementCounter() {
  clientCounter.value++;
  await updateToken();
  // Automatically fill verification input for easier demoing, or leave empty?
  // Let's leave empty to force user action, or maybe better UX to clear validation status
  isValid.value = null;
  delta.value = null;
}

async function generateQR() {
  if (!secret.value) return;
  try {
    const uri = generateURI({
      strategy: "hotp",
      issuer: issuer.value,
      label: label.value,
      secret: secret.value,
      counter: clientCounter.value,
    });

    qrCodeUrl.value = await QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch (e) {
    console.error("QR generation error:", e);
  }
}

async function verifyToken() {
  if (!userInput.value) {
    isValid.value = null;
    delta.value = null;
    return;
  }

  try {
    // Verify against server counter with a window (tolerance)
    // hotpVerify will check [counter, counter + window]
    const window = 50;
    const result = await hotpVerify({
      strategy: "hotp",
      secret: secret.value,
      token: userInput.value,
      counter: serverCounter.value,
      counterTolerance: window, // This acts as the look-ahead window
    });

    isValid.value = result.valid;
    delta.value = result.valid ? result.delta : null;

    if (result.valid && result.delta >= 0) {
      // If valid, server syncs up to the used counter + 1
      // The delta returned by otplib for HOTP is (matched_counter - initial_counter)
      serverCounter.value = serverCounter.value + result.delta + 1;
    }
  } catch (e) {
    console.error("Verification error:", e);
    isValid.value = false;
    delta.value = null;
  }
}

onMounted(() => {
  generateNewSecret();
});
</script>

<template>
  <div class="hotp-demo-container">
    <div class="card qr-config-card">
      <div class="card-header">
        <h3>Setup</h3>
        <button
          :class="showConfig ? 'btn-save' : 'gear-icon'"
          @click="showConfig = !showConfig"
          title="Configuration"
          aria-label="Configuration"
        >
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
          <input v-model="issuer" type="text" @change="generateQR" />
        </div>
        <div class="form-group">
          <label>Label</label>
          <input v-model="label" type="text" @change="generateQR" />
        </div>
        <div class="form-group">
          <label>Initial Counter</label>
          <input v-model="setupCounter" type="number" min="0" @change="updateSetupCounter" />
        </div>
      </div>

      <div v-if="!showConfig && qrCodeUrl" class="qr-wrapper">
        <img :src="qrCodeUrl" alt="HOTP QR Code" />

        <button class="btn-primary generate-secret-btn" @click="generateNewSecret">
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

    <div class="card token-card">
      <div class="card-header">
        <h3>Client (Generate)</h3>
      </div>

      <div class="token-display">
        <div class="token-container">
          <div class="token-value">{{ currentToken }}</div>
          <div class="counter-label">Counter: {{ clientCounter }}</div>
        </div>
      </div>

      <button class="btn-primary increment-btn" @click="incrementCounter">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="refresh-icon"
        >
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
        </svg>
        Generate Next Token
      </button>

      <div class="help-text">Click to increment the counter and generate the next OTP.</div>
    </div>

    <div class="card verify-card">
      <div class="card-header">
        <h3>Server (Verify)</h3>
      </div>

      <div class="server-status">
        <div class="counter-label">Expected Counter: {{ serverCounter }}</div>
      </div>

      <div class="verify-section">
        <div class="verify-form">
          <input
            v-model="userInput"
            type="text"
            placeholder="Enter code"
            maxlength="6"
            @keyup.enter="verifyToken"
          />
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
            <span>Valid!</span>
          </div>
          <div class="sync-info" v-if="delta !== null && delta !== 0">
             Matched at counter +{{ delta }}
          </div>
        </div>

        <div v-else-if="isValid === false" class="result invalid">
          <div class="result-content">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>Invalid</span>
          </div>
        </div>
      </div>

      <div class="server-explanation">
        The server accepts any token from the current counter up to a window ahead (resync).
      </div>
    </div>
  </div>
</template>

<style scoped>
.hotp-demo-container {
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

.btn-save {
  background: var(--vp-button-brand-bg);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-save:hover {
  opacity: 0.9;
}

.config-panel {
  margin-bottom: 1rem;
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

input[type="text"]:focus,
input[type="number"]:focus {
  outline: none;
  border-color: var(--vp-c-brand);
}

input[type="number"] {
  width: 100%;
  padding: 0.625rem;
  border: 1px solid var(--vp-c-border);
  border-radius: 6px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.875rem;
  transition: border-color 0.2s;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-primary:hover {
  opacity: 0.9;
}

.qr-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: auto;
  margin-bottom: auto;
}

.qr-wrapper img {
  border: 4px solid white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.secret-section {
  text-align: center;
  width: 100%;
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
  padding: 0.5rem;
  background: var(--vp-c-bg);
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 1rem;
  word-break: break-all;
}

.token-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.token-container {
  text-align: center;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 2rem;
  min-width: 200px;
}

.token-value {
  font-family: "Courier New", monospace;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--vp-c-brand);
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}

.counter-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.increment-btn {
  margin-top: 1rem;
}

.help-text {
  text-align: center;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-top: 1rem;
}

.server-status {
  text-align: center;
  padding: 1rem;
  background: var(--vp-c-bg);
  border-radius: 8px;
  margin-bottom: 1rem;
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
  margin-top: 1rem;
}

.result-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
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

.sync-info {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  text-align: center;
  opacity: 0.9;
}

.server-explanation {
  margin-top: auto;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  text-align: center;
  padding-top: 1rem;
}

@media (max-width: 768px) {
  .hotp-demo-container {
    grid-template-columns: 1fr;
  }
}
</style>
