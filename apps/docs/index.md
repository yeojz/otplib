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
      text: See it in action
      link: "#demo"
    - theme: alt
      text: Get Started
      link: /guide/getting-started
---

<div class="features-section">
  <div class="features-header">
    <h2>Considerations</h2>
    <p>Built with modern practices</p>
  </div>
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/shield-check.svg')"></div>
      <h3>RFC Compliant</h3>
      <p>Full implementation of RFC 4226 (HOTP) and RFC 6238 (TOTP) specifications with comprehensive test coverage.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/typescript.svg')"></div>
      <h3>TypeScript Native</h3>
      <p>Written in TypeScript with complete type definitions. Async-first API design with synchronous alternatives.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/multi-runtime.svg')"></div>
      <h3>Multi-Runtime</h3>
      <p>Tested across Node.js, Bun, Deno, and browsers with runtime-specific crypto adapters.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/pluggable.svg')"></div>
      <h3>Pluggable Architecture</h3>
      <p>Swap crypto and Base32 implementations via plugins. Use Web Crypto, Node crypto, or bring your own.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/zero-deps.svg')"></div>
      <h3>Small footprint</h3>
      <p>Core packages have no external dependencies. Minimal footprint with tree-shakeable ESM exports.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/uri-gen.svg')"></div>
      <h3>Authenticator Compatible</h3>
      <p>Use with common authenticator apps like Google, Microsoft, Authy and many more.</p>
    </div>
  </div>
</div>

<div id="demo" class="demo-section-wrapper">
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
