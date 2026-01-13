---
layout: home

hero:
  name: otplib
  text: One-Time Password Library
  tagline: TypeScript-first library for HOTP and TOTP / Authenticator with multi-runtime and plugin support
  image:
    light: /assets/otplib-b.svg
    dark: /assets/otplib-w.svg
    alt: otplib logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Try Demo
      link: "#demo"
---

## Try It {#demo}

<div class="demo-section">

<DemoHeader title="TOTP" description="Generates a new token every 30 seconds based on the current time." />

<TOTPDemo />

</div>

<div class="demo-section">

<DemoHeader title="HOTP" description="Generates a new token every time the counter is incremented." />

<HOTPDemo />

</div>
