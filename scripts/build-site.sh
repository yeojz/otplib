#!/bin/bash

if [ "$OTPLIB_BUILD_SITE_PACKAGE" == "true" ]; then
  echo "\n--- installing and build npm package ---"
  OTPLIB_SETUP_EXTRAS=skip \
    OTPLIB_BUILD_REINSTALL=true \
    OTPLIB_BUILD_CLEAN=true \
    OTPLIB_BUILD_MODULE=false \
    OTPLIB_BUILD_BUNDLE=true \
    OTPLIB_BUILD_INCLUDE_BUFFER=true \
    OTPLIB_BUILD_COPY_META=false \
    npm run build
fi

echo "\n--- cleaning prev site builds ---"
npx rimraf \
  ./builds/typedocs \
  ./website/static/otplib-browser \
  ./website/static/docs \
  ./website/static/api \
  ./website/public

echo "\n--- copying bundle to website ---"
cp -r ./builds/otplib/preset-browser/. ./website/static/otplib-browser

echo "\n--- building api docs ---"
npx typedoc \
  --hideGenerator \
  --options ./configs/typedoc.json \
  --out ./builds/typedocs

echo "\n--- copying api docs to website ---"
cp -r ./builds/typedocs/. ./website/static/api

echo "\n--- changing to website folder ---"
cd website

if [ "$OTPLIB_BUILD_SITE_REINSTALL" == "true" ]; then
  echo "\n--- install website node_modules ---"
  npm ci;
fi

npm run build
