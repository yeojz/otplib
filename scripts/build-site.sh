#!/bin/bash

if [ "$OTPLIB_BUILD_SITE_PACKAGE" == "true" ]; then
  echo "\n installing and build npm package..."
  npm run setup

  OTPLIB_BUILD_SKIP_TYPEDEF=true \
  NODE_ENV=production \
  npm run build
fi

echo "\n cleaning prev site builds..."
npx rimraf \
  ./builds/typedocs \
  ./website/static/otplib-browser \
  ./website/static/docs \
  ./website/static/api \
  ./website/public

echo "\n[[ copying bundle to website ]]"
cp -r ./packages/otplib-preset-browser/build/. ./website/static/otplib-browser

echo "\n[[ building api docs ]]"
npx typedoc \
  --hideGenerator \
  --options ./configs/typedoc.json \
  --out ./builds/typedocs

echo "\n[[ copying api docs to website ]]"
cp -r ./builds/typedocs/. ./website/static/api

echo "\n[[ changing to website folder ]]"
cd website

if [ "$OTPLIB_BUILD_SITE_REINSTALL" == "true" ]; then
  echo "\n[[ installing website node_modules ]]"
  npm ci;
fi

npm run build
