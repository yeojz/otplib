#!/bin/bash

npm run test -- \
  --testPathIgnorePatterns="packages/pkg-tests" \
  --testPathIgnorePatterns="packages/otplib-plugin-crypto-async-ronomon" \
  --testPathIgnorePatterns="packages/otplib-preset-default-async"
