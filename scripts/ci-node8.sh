#!/bin/bash

echo "\n[[ Setting up dependencies ]]"
npx lerna bootstrap --ci --hoist \
  --ignore @otplib/plugin-crypto-async-ronomon \
  --ignore @otplib/preset-default-async


echo "\n[[ cleaning prev builds ]]"
npm run clean

echo "\n[[ building library ]]"
npx lerna run build:lib \
  --ignore @otplib/plugin-crypto-async-ronomon \
  --ignore @otplib/preset-default-async

echo "\n[[ testing library ]]"
npm run test:runner -- \
  --testPathIgnorePatterns="packages/otplib-plugin-crypto-async-ronomon" \
  --testPathIgnorePatterns="packages/otplib-preset-default-async" \
  --testPathIgnorePatterns="tests/builds"
