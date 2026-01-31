---
title: otplib-cli
layout: page
sidebar: false
---

<script setup>
import CLIShowcase from '../.vitepress/components/CLIShowcase.vue'
</script>

<div class="cli-page">

<section class="cli-hero">
  <div class="hero-bg"></div>
  <div class="hero-content">
    <h1>otplib-cli</h1>
    <p>A Command Line tool for OTP.<br/>Stateless. Scriptable. Storage agnostic.</p>
    <div class="install-cmd">
      <span>$</span>
      <code>npm install -g otplib-cli</code>
    </div>
  </div>
</section>

<CLIShowcase />

<section class="architecture">
  <span class="label">ARCHITECTURE</span>
  <h2>Stateless by Design</h2>

  <div class="flow">
    <div class="node">
      <div class="icon icon-unlock"></div>
      <strong>storage</strong>
      <span>decrypt</span>
    </div>
    <div class="arrow"></div>
    <div class="node highlight">
      <div class="icon icon-process"></div>
      <strong>otplib (CLI)</strong>
      <span>process</span>
    </div>
    <div class="arrow"></div>
    <div class="node">
      <div class="icon icon-lock"></div>
      <strong>storage</strong>
      <span>encrypt</span>
    </div>
  </div>

  <div class="cards">
    <div class="card">
      <h4>Composable</h4>
      <p><code>otplib</code> is stateless, utilising <code>stdin</code> / <code>stdout</code>, allowing the possibility of piping into and from other tools.</p>
    </div>
    <div class="card">
      <h4>Delegated Storage</h4>
      <p>For <code>otplibx</code>, we have chosen <a href="https://dotenvx.com/" target="_blank">dotenvx</a> for simplicity.</p>
      <p>But as it's storage agnostic, it would work with Bitwarden, AWS Secrets Manager, or similar tooling that outputs expected data.</p>
    </div>
  </div>
</section>

<section class="cta">
  <h2>Ready to get started?</h2>
  <p>Check out the full documentation for detailed usage, architecture, and integration guides.</p>
  <a href="/guide/cli-tool" class="btn">Read the Docs</a>
</section>

</div>

<style>
.cli-page {
  --accent: var(--cipher-accent, #22d3ee);
  --accent-glow: var(--cipher-accent-glow, rgba(34, 211, 238, 0.3));
  --muted: var(--cipher-text-muted, #94a3b8);
  --border: var(--cipher-border, rgba(148, 163, 184, 0.1));
  --surface: var(--cipher-surface, rgba(15, 23, 42, 0.6));
}

/* Full-width sections */
.cli-hero,
.architecture,
.cta {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  padding: 4rem 2rem;
}

/* Hero */
.cli-hero {
  position: relative;
  padding: 6rem 2rem;
  background: linear-gradient(180deg, var(--vp-c-bg-alt) 0%, var(--vp-c-bg) 100%);
  text-align: center;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--border) 1px, transparent 1px),
    linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  max-width: 800px;
  margin: 0 auto;
}

.cli-hero h1 {
  font-family: var(--vp-font-family-mono);
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  line-height: 1.2;
  margin: 0 0 1.5rem;
  padding: 0.2em 0;
  background: linear-gradient(135deg, var(--accent) 0%, #67e8f9 50%, var(--accent) 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient 4s ease-in-out infinite;
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.cli-hero p {
  font-size: 1.2rem;
  color: var(--muted);
  margin: 0 0 2rem;
  line-height: 1.7;
}

.install-cmd {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-family: var(--vp-font-family-mono);
}

.install-cmd span {
  color: var(--accent);
  font-weight: 700;
}

.install-cmd code {
  background: transparent;
  color: var(--vp-c-text-1);
}

/* Architecture */
.architecture {
  background: var(--vp-c-bg-alt);
  text-align: center;
}

.architecture .label {
  font-family: var(--vp-font-family-mono);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: var(--accent);
}

.architecture h2 {
  font-family: var(--vp-font-family-mono);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0.5rem 0 2.5rem;
}

.flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem 2rem;
  background: var(--vp-c-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
  min-width: 110px;
}

.node.highlight {
  border-color: var(--accent);
  box-shadow: 0 0 20px var(--accent-glow);
}

.node strong {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9rem;
}

.node span {
  font-size: 0.7rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.icon {
  width: 28px;
  height: 28px;
  background: var(--accent);
  margin-bottom: 0.5rem;
}

.icon-unlock {
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Crect x='3' y='11' width='18' height='11' rx='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 9.9-1'/%3E%3C/svg%3E") center/contain no-repeat;
}

.icon-process {
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Cpath d='M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83'/%3E%3C/svg%3E") center/contain no-repeat;
}

.icon-lock {
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2'%3E%3Crect x='3' y='11' width='18' height='11' rx='2'/%3E%3Cpath d='M7 11V7a5 5 0 0 1 10 0v4'/%3E%3C/svg%3E") center/contain no-repeat;
}

.arrow {
  width: 32px;
  height: 2px;
  background: linear-gradient(90deg, var(--border), var(--accent));
  position: relative;
}

.arrow::after {
  content: "";
  position: absolute;
  right: -4px;
  top: -4px;
  border: 5px solid transparent;
  border-left-color: var(--accent);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  max-width: 1000px;
  margin: 0 auto;
  text-align: left;
}

.card {
  padding: 1.5rem;
  min-height: auto;
  background: var(--vp-c-bg);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.card h4 {
  font-family: var(--vp-font-family-mono);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
}

.card p {
  font-size: 0.875rem;
  color: var(--muted);
  margin: 0;
  line-height: 1.6;
}

.card a {
  color: var(--accent);
}

.card code {
  color: var(--accent);
}

/* CTA */
.cta {
  background: linear-gradient(180deg, var(--vp-c-bg) 0%, var(--vp-c-bg-alt) 100%);
  text-align: center;
}

.cta h2 {
  font-family: var(--vp-font-family-mono);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 1rem;
}

.cta p {
  font-size: 1.1rem;
  color: var(--muted);
  margin: 0 0 2rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--vp-c-brand-3);
  color: #ffffff;
  border-radius: 4px;
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.btn:hover::before {
  transform: translateX(100%);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px var(--accent-glow);
}

.dark .btn {
  background: #136377;
  color: #ffffff;
}

/* Mobile */
@media (max-width: 640px) {
  .cli-hero h1 {
    font-size: 2.5rem;
  }

  .flow {
    flex-direction: column;
  }

  .arrow {
    width: 2px;
    height: 24px;
    background: linear-gradient(180deg, var(--border), var(--accent));
  }

  .arrow::after {
    right: -4px;
    top: auto;
    bottom: -4px;
    border: 5px solid transparent;
    border-top-color: var(--accent);
    border-left-color: transparent;
  }
}
</style>
