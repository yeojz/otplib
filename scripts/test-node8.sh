#!/bin/bash

npm run test -- \
  --testPathIgnorePatterns="packages/tests-builds" \
  --testPathIgnorePatterns="packages/otplib-plugin-crypto-async-ronomon" \
  --testPathIgnorePatterns="packages/otplib-preset-default-async" \
  --testPathIgnorePatterns="packages/tests-builds/example"
