#!/bin/bash

npm run test -- \
  --testPathIgnorePatterns="packages/package-tests" \
  --testPathIgnorePatterns="packages/otplib-plugin-crypto-async-ronomon" \
  --testPathIgnorePatterns="packages/otplib-preset-default-async"
