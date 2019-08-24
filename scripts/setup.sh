#!/bin/bash

if [ -z "$OTPLIB_SETUP_COMMON" ] || [ "$OTPLIB_SETUP_COMMON" == "true" ]; then
  echo "Installing node_modules..."
  npm ci
fi

if [ "$OTPLIB_SETUP_EXTRAS" = "skip" ]; then
  echo "Skipping install of extra dependencies..."

elif [ "$OTPLIB_SETUP_EXTRAS" = "testbrowser" ]; then
  echo "Installing browser testing extras..."

  npm i --no-save \
    puppeteer

elif [ "$OTPLIB_SETUP_EXTRAS" = "testmodule" ]; then
  echo "Installing module testing extras..."

  npm i --no-save \
    @ronomon/crypto-async

else
  echo "Installing all extra dependencies..."

  npm i --no-save \
    puppeteer \
    @ronomon/crypto-async
fi
