#!/bin/bash
echo "[[ downloading buffer.js ]]"
mkdir -p packages/otplib-preset-browser/externals
curl https://bundle.run/buffer -L --output packages/otplib-preset-browser/externals/buffer.js
