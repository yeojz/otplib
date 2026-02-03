<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const activeTab = ref('otplibx')
const currentStep = ref(0)
const isTyping = ref(false)
const currentOutput = ref('')
const cursorVisible = ref(true)

const otplibxCommands = [
  {
    cmd: 'otplibx init',
    label: 'init',
    output: `created .env.otplibx
created .env.keys

Next steps:
  1. Add .env.keys to .gitignore
  2. Run: cat uri.txt | otplibx add`,
    delay: 800
  },
  {
    cmd: 'cat account.txt | otplibx add',
    label: 'add',
    output: `A7KX4N2PQ`,
    delay: 600
  },
  {
    cmd: 'otplibx list',
    label: 'list',
    output: `GitHub:user@example.com	A7KX4N2PQ	totp`,
    delay: 400
  },
  {
    cmd: 'otplibx token A7KX4N2PQ',
    label: 'token',
    output: `847291`,
    delay: 300
  },
  {
    cmd: 'otplibx verify AABC12345 492817',
    label: 'verify',
    output: `// exit 0 = success`,
    delay: 400
  },
]

const otplibCommands = [
  {
    cmd: 'cat account.txt | otplib encode',
    label: 'encode',
    output: `AABC12345=eyJkYXRhIjp7InR5cGUiOiJ0b3RwIiwic2VjcmV0Ijoi...`,
    delay: 600
  },
  {
    cmd: 'cat accounts.json | otplib list',
    label: 'list',
    output: `AABC12345	totp	GitHub:user@example.com`,
    delay: 400
  },
  {
    cmd: 'cat accounts.json | otplib token AABC12345',
    label: 'token',
    output: `492817`,
    delay: 300
  },
  {
    cmd: 'cat accounts.json | otplib verify AABC12345 492817',
    label: 'verify',
    output: `// exit 0 = success`,
    delay: 400
  },
]

const commands = computed(() => activeTab.value === 'otplibx' ? otplibxCommands : otplibCommands)
const currentCommand = computed(() => commands.value[currentStep.value])

let typingInterval = null
let cursorInterval = null
let autoPlayTimeout = null

const typeCommand = () => {
  isTyping.value = true
  currentOutput.value = ''
  const cmd = currentCommand.value.cmd
  let charIndex = 0

  typingInterval = setInterval(() => {
    if (charIndex < cmd.length) {
      charIndex++
    } else {
      clearInterval(typingInterval)
      setTimeout(() => {
        showOutput()
      }, 300)
    }
  }, 50)
}

const showOutput = () => {
  currentOutput.value = currentCommand.value.output
  isTyping.value = false

  autoPlayTimeout = setTimeout(() => {
    nextStep()
  }, 2500)
}

const nextStep = () => {
  clearTimeout(autoPlayTimeout)
  currentStep.value = (currentStep.value + 1) % commands.value.length
  typeCommand()
}

const goToStep = (index) => {
  clearTimeout(autoPlayTimeout)
  clearInterval(typingInterval)
  currentStep.value = index
  currentOutput.value = ''
  typeCommand()
}

const switchTab = (tab) => {
  if (tab === activeTab.value) return
  clearTimeout(autoPlayTimeout)
  clearInterval(typingInterval)
  activeTab.value = tab
  currentStep.value = 0
  currentOutput.value = ''
  setTimeout(() => {
    typeCommand()
  }, 200)
}

onMounted(() => {
  cursorInterval = setInterval(() => {
    cursorVisible.value = !cursorVisible.value
  }, 530)

  setTimeout(() => {
    typeCommand()
  }, 500)
})

onUnmounted(() => {
  clearInterval(typingInterval)
  clearInterval(cursorInterval)
  clearTimeout(autoPlayTimeout)
})
</script>

<template>
  <div class="cli-showcase">
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'otplibx' }"
        @click="switchTab('otplibx')"
      >
        <span class="tab-icon recommended"></span>
        <span class="tab-label">otplibx</span>
        <span class="tab-badge">QuickStart</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'otplib' }"
        @click="switchTab('otplib')"
      >
        <span class="tab-icon"></span>
        <span class="tab-label">otplib</span>
        <span class="tab-badge secondary">Stateless</span>
      </button>
    </div>

    <div class="terminal">
      <div class="terminal-header">
        <div class="terminal-buttons">
          <span class="btn-close"></span>
          <span class="btn-minimize"></span>
          <span class="btn-maximize"></span>
        </div>
        <div class="terminal-title">{{ activeTab === 'otplibx' ? 'otplibx - encrypted storage' : 'otplib - stateless cli' }}</div>
        <div class="terminal-spacer"></div>
      </div>
      <div class="terminal-body">
        <div class="terminal-line prompt-line">
          <span class="prompt">$</span>
          <span class="command">{{ currentCommand.cmd }}</span>
          <span class="cursor" :class="{ visible: cursorVisible && isTyping }">█</span>
        </div>
        <div class="terminal-output" v-if="currentOutput">
          <div
            v-for="(line, i) in currentOutput.split('\n')"
            :key="i"
            class="output-line"
            :class="{
              'output-highlight': line.startsWith('A') && /^A[0-9A-Z]+/.test(line) || /^\d{6}$/.test(line) || line === 'true',
              'output-label': line.includes('\t')
            }"
          >{{ line }}</div>
        </div>
      </div>
    </div>

    <div class="showcase-controls">
      <button
        v-for="(cmd, index) in commands"
        :key="`${activeTab}-${index}`"
        class="step-btn"
        :class="{ active: currentStep === index }"
        @click="goToStep(index)"
      >
        <span class="step-num">{{ index + 1 }}</span>
        <span class="step-label">{{ cmd.label }}</span>
      </button>
    </div>

    <div class="cli-description">
      <p v-if="activeTab === 'otplibx'">
        Using an encrypted <code>.env</code> file (symmetric key) for storage.
      </p>
      <p v-else>
        Stateless CLI for scripting, pipelines, and custom secret backends.
      </p>
    </div>
  </div>
</template>

<style scoped>
.cli-showcase {
  max-width: 700px;
  margin: 0 auto 3rem;
  padding: 0 1rem;
}

.tab-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  justify-content: center;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--cipher-surface);
  border: 1px solid var(--cipher-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--vp-font-family-mono);
}

.tab-btn:hover {
  border-color: var(--cipher-accent);
  background: var(--vp-c-bg-soft);
}

.tab-btn.active {
  border-color: var(--cipher-accent);
  background: rgba(34, 211, 238, 0.1);
  box-shadow: 0 0 16px var(--cipher-accent-glow);
}

.tab-icon {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cipher-border);
}

.tab-icon.recommended {
  background: var(--cipher-accent);
  box-shadow: 0 0 8px var(--cipher-accent-glow);
}

.tab-btn.active .tab-icon {
  background: var(--cipher-accent);
  box-shadow: 0 0 8px var(--cipher-accent-glow);
}

.tab-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.tab-btn.active .tab-label {
  color: var(--cipher-accent);
}

.tab-badge {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 4px;
  color: #10b981;
}

.tab-badge.secondary {
  background: var(--cipher-surface);
  border-color: var(--cipher-border);
  color: var(--cipher-text-muted);
}

.terminal {
  background: #0d1117;
  border-radius: 10px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(34, 211, 238, 0.1),
    0 20px 50px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(34, 211, 238, 0.08);
  font-family: var(--vp-font-family-mono);
}

.terminal-header {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #161b22;
  border-bottom: 1px solid rgba(34, 211, 238, 0.1);
}

.terminal-buttons {
  display: flex;
  gap: 0.5rem;
}

.terminal-buttons span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.btn-close {
  background: #ff5f56;
}

.btn-minimize {
  background: #ffbd2e;
}

.btn-maximize {
  background: #27c93f;
}

.terminal-title {
  flex: 1;
  text-align: center;
  font-size: 0.75rem;
  color: #6e7681;
  font-weight: 500;
}

.terminal-spacer {
  width: 52px;
}

.terminal-body {
  padding: 1.25rem 1.5rem;
  min-height: 180px;
}

.terminal-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.prompt {
  color: #22d3ee;
  font-weight: 700;
}

.command {
  color: #e6edf3;
}

.cursor {
  color: #22d3ee;
  opacity: 0;
  margin-left: -2px;
}

.cursor.visible {
  opacity: 1;
}

.terminal-output {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.output-line {
  color: #8b949e;
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre;
}

.output-muted {
  color: #484f58;
  font-size: 0.8rem;
}

.output-highlight {
  color: #22d3ee;
  font-weight: 600;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
  margin: 0.25rem 0;
}

.output-label {
  color: #7ee787;
}

.showcase-controls {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

.step-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--cipher-surface);
  border: 1px solid var(--cipher-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--vp-font-family-mono);
}

.step-btn:hover {
  border-color: var(--cipher-accent);
  background: var(--vp-c-bg-soft);
}

.step-btn.active {
  border-color: var(--cipher-accent);
  background: rgba(34, 211, 238, 0.1);
  box-shadow: 0 0 12px var(--cipher-accent-glow);
}

.step-num {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--cipher-border);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--vp-c-text-2);
}

.step-btn.active .step-num {
  background: var(--cipher-accent);
  color: #0a1419;
}

.step-label {
  font-size: 0.75rem;
  color: var(--cipher-text-muted);
  text-transform: lowercase;
}

.step-btn.active .step-label {
  color: var(--cipher-accent);
}

.cli-description {
  text-align: center;
  margin-top: 1.5rem;
}

.cli-description p {
  font-size: 0.9rem;
  color: var(--cipher-text-muted);
  margin: 0;
  line-height: 1.6;
}

.cli-description code {
  color: var(--cipher-accent);
  text-decoration: none;
}

@media (max-width: 640px) {
  .cli-showcase {
    padding: 0 0.5rem;
  }

  .tab-bar {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab-btn {
    justify-content: center;
  }

  .terminal-body {
    padding: 1rem;
    min-height: 200px;
  }

  .output-line {
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .output-highlight {
    font-size: 1rem;
  }

  .step-btn {
    padding: 0.4rem 0.75rem;
  }

  .step-label {
    display: none;
  }
}
</style>
