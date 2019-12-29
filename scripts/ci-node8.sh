#!/bin/bash

echo "[[ setting up dependencies ]]"
npx lerna bootstrap --ci --hoist \
  --ignore @otplib/plugin-crypto-async-ronomon \
  --ignore @otplib/preset-default-async


echo "[[ cleaning prev builds ]]"
npm run clean

echo "[[ building library ]]"
npx lerna run build:lib \
  --ignore @otplib/plugin-crypto-async-ronomon \
  --ignore @otplib/preset-default-async

echo "[[ testing library ]]"
npm run test:runner -- \
  --testPathIgnorePatterns="packages/otplib-plugin-crypto-async-ronomon" \
  --testPathIgnorePatterns="packages/otplib-preset-default-async" \
  --testPathIgnorePatterns="tests/" \
