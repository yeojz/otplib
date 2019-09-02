#!/bin/bash

echo "Setting up dependencies"

if [ "$OTPLIB_SETUP_TYPE" = "node8" ]; then
  echo "Skipping some node 8 incompatible modules..."

  npx lerna bootstrap --ci --hoist \
    --ignore otplib-plugin-crypto-async-ronomon \
    --ignore otplib-preset-default-async

else
  echo "Installing all..."
  npx lerna bootstrap --ci --hoist
fi
