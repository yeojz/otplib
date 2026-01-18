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
    <h2>Key Features</h2>
    <p>Built with modern practices</p>
  </div>
  <div class="features-grid">
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/typescript.svg')"></div>
      <h3>TypeScript Native</h3>
      <p>Written in TypeScript with complete type definitions. Async-first API design with synchronous alternatives.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/pluggable.svg')"></div>
      <h3>Pluggable Architecture</h3>
      <p>Swap crypto and Base32 implementations via plugins. Use Web Crypto, Node crypto, or bring your own.</p>
    </div>
    <div class="feature-card">
      <div class="feature-icon" style="--icon-url: url('/icons/shield-check.svg')"></div>
      <h3>RFC Compliant / <br />Authenticator Compatible</h3>
      <p>Full implementation of RFC 4226 (HOTP) and RFC 6238 (TOTP) specifications. <br />Compatible with common authenticator apps like Google, Microsoft, Authy and many more.</p>
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
