#!/bin/bash

# Install otplib packages for smoke testing
# Version can be configured via OTPLIB_VERSION environment variable
# Default: latest

VERSION="${OTPLIB_VERSION:-latest}"

echo "Installing otplib packages@${VERSION}..."

# Use npm with --no-save since pnpm add always modifies package.json
npm install --no-save \
  otplib@${VERSION} \
  @otplib/core@${VERSION} \
  @otplib/totp@${VERSION} \
  @otplib/hotp@${VERSION} \
  @otplib/uri@${VERSION} \
  @otplib/plugin-base32-scure@${VERSION} \
  @otplib/plugin-crypto-noble@${VERSION} \
  @otplib/plugin-crypto-node@${VERSION}

echo "Installed packages@${VERSION}"
