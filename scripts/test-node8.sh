#!/bin/bash

npm run test -- \
  --testPathIgnorePatterns="packages/otplib-plugin-crypto-async-ronomon" \
  --testPathIgnorePatterns="packages/otplib-preset-default-async" \
  --testPathIgnorePatterns="packages/otplib-preset-browser/test/browser"
