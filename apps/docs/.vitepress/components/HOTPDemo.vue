<script setup>
import { ref, onMounted } from "vue";
import QRCode from "qrcode";
import {
  generate as hotpGenerate,
  verify as hotpVerify,
  generateSecret as generateSecretFn,
  generateURI,
} from "otplib";
import DemoSetupCard from "./DemoSetupCard.vue";
import DemoVerifyCard from "./DemoVerifyCard.vue";

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

// ... (functions remain same: generateNewSecret, updateToken, incrementCounter, generateQR, verifyToken) ...
// Except for generateNewSecret which needs to trigger update

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
    const window = 50;
    const result = await hotpVerify({
      strategy: "hotp",
      secret: secret.value,
      token: userInput.value,
      counter: serverCounter.value,
      counterTolerance: window,
    });

    isValid.value = result.valid;
    delta.value = result.valid ? result.delta : null;

    if (result.valid && result.delta >= 0) {
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
  <div class="hotp-demo-container demo-container">
    <DemoSetupCard
      v-model:issuer="issuer"
      v-model:label="label"
      :secret="secret"
      :qr-code-url="qrCodeUrl"
      @generate-new-secret="generateNewSecret"
    >
      <template #extra-config>
        <div class="form-group">
          <label>Initial Counter</label>
          <input v-model="setupCounter" type="number" min="0" @change="updateSetupCounter" />
        </div>
      </template>
    </DemoSetupCard>

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
        <span class="icon-refresh"></span>
        Generate Next Token
      </button>

      <div class="help-text">Click to increment the counter and generate the next OTP.</div>
    </div>

    <DemoVerifyCard
      v-model:user-input="userInput"
      :is-valid="isValid"
      :delta="delta"
      :server-counter="serverCounter"
      @verify="verifyToken"
    >
      <template #match-info="{ delta }">
        Matched at counter {{ delta > 0 ? '+' : '' }}{{ delta }}
      </template>
      <template #explanation>
        The server accepts any token from the current counter up to a window ahead (resync).
      </template>
    </DemoVerifyCard>
  </div>
</template>



