---
layout: home

hero:
  name: otplib
  text: One-Time Password Library
  tagline: TypeScript-first library for HOTP and TOTP authentication with multi-runtime support and pluggable architecture
  image:
    light: /assets/otplib-b.svg
    dark: /assets/otplib-w.svg
    alt: otplib logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/yeojz/otplib
---

<div class="features-section">
  <div class="features-header">
    <h2>Capabilities</h2>
    <p>Built for modern authentication</p>
  </div>
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
      </div>
      <h3>RFC Compliant</h3>
      <p>Full implementation of RFC 4226 (HOTP) and RFC 6238 (TOTP) specifications with comprehensive test coverage.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 7h10"/><path d="M7 12h10"/><path d="M7 17h10"/></svg>
      </div>
      <h3>TypeScript Native</h3>
      <p>Written in TypeScript with complete type definitions. Async-first API design with synchronous alternatives.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><circle cx="12" cy="12" r="4"/></svg>
      </div>
      <h3>Multi-Runtime</h3>
      <p>Works seamlessly across Node.js, Bun, Deno, and browsers with runtime-specific crypto adapters.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </div>
      <h3>Pluggable Architecture</h3>
      <p>Swap crypto and Base32 implementations via plugins. Use Web Crypto, Node crypto, or bring your own.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      </div>
      <h3>Zero Dependencies</h3>
      <p>Core packages have no external dependencies. Minimal footprint with tree-shakeable ESM exports.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>
      </div>
      <h3>URI Generation</h3>
      <p>Generate otpauth:// URIs for QR codes compatible with Google Authenticator, Authy, and other apps.</p>
    </div>
  </div>
</div>

<div class="demo-section-wrapper">
  <div class="demo-intro">
    <h2>Interactive Demo</h2>
    <p>See it in action</p>
  </div>

<div class="demo-section">

<DemoHeader title="TOTP" description="Time-based tokens that refresh every 30 seconds. The standard for authenticator apps." />

<TOTPDemo />

</div>

<div class="demo-section">

<DemoHeader title="HOTP" description="Counter-based tokens that increment with each use. Ideal for hardware tokens." />

<HOTPDemo />

</div>

</div>
