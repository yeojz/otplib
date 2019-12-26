#!/bin/bash

if [ -z "$OTPLIB_BUILD_CLEAN" ] || [ "$OTPLIB_BUILD_CLEAN" == "true" ]; then
  echo "--- cleaning prev builds ---"
  npx rimraf \
    packages/**/build
fi

if [ -z "$OTPLIB_BUILD" ] || [ "$OTPLIB_BUILD" == "true" ]; then
  echo "--- building modules ---"
  NODE_ENV=production npx lerna run build
fi

if [ -z "$OTPLIB_BUILD_COPY_META" ] || [ "$OTPLIB_BUILD_COPY_META" == "true" ]; then
  echo "--- (builds) copying otplib-preset-browser to otplib/preset-browser ---"
  mkdir -p ./builds/packages/otplib/preset-browser
  cp ./builds/packages/otplib-preset-browser/* ./builds/packages/otplib/preset-browser

  # echo "--- copying meta ---"
  # cp ./README.md ./builds/otplib/README.md
  # cp ./LICENSE ./builds/otplib/LICENSE
  # cp ./package.json ./builds/otplib/package.json
  # cp ./.npmignore ./builds/otplib/.npmignore
fi
