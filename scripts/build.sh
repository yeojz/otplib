#!/bin/bash

if [ -z "$OTPLIB_BUILD_CLEAN" ] || [ "$OTPLIB_BUILD_CLEAN" == "true" ]; then
  echo "--- cleaning prev builds ---"
  npx rimraf \
    builds/packages
fi

if [ -z "$OTPLIB_BUILD_MODULE" ] || [ "$OTPLIB_BUILD_MODULE" == "true" ]; then
  echo "--- building modules ---"
  NODE_ENV=production npx rollup \
    -c ./configs/rollup.config.js
fi

if [ -z "$OTPLIB_BUILD_BUNDLE" ] || [ "$OTPLIB_BUILD_BUNDLE" == "true" ]; then
  echo "--- building bundles ---"
  NODE_ENV=production npx webpack \
    --config ./configs/webpack.config.js
fi

if [ -z "$OTPLIB_BUILD_INCLUDE_BUFFER" ] || [ "$OTPLIB_BUILD_INCLUDE_BUFFER" == "true" ]; then
  echo "--- copying buffer module ---"
  cp ./packages/pkg-extras/buffer.js ./builds/packages/otplib-preset-browser/buffer.js
fi

if [ -z "$OTPLIB_BUILD_COPY_META" ] || [ "$OTPLIB_BUILD_COPY_META" == "true" ]; then
  echo "--- building .d.ts ---"
  npx tsc \
    --emitDeclarationOnly \
    -p ./configs/tsconfig.json

  echo "--- (builds) moving src/*.d.ts one folder up from src ---"
  find ./builds/packages \
    -name "*.d.ts" \
    -type f \
    -exec sh -c 'mv {} $(dirname {})/..' \;

  echo "--- (builds) removing src folder ---"
  find ./builds/packages \
    -name "src" \
    -type d \
    -delete

  echo "--- (builds) copying otplib-preset-browser to otplib/preset-browser ---"
  mkdir -p ./builds/packages/otplib/preset-browser
  cp ./builds/packages/otplib-preset-browser/* ./builds/packages/otplib/preset-browser

  # echo "--- copying meta ---"
  # cp ./README.md ./builds/otplib/README.md
  # cp ./LICENSE ./builds/otplib/LICENSE
  # cp ./package.json ./builds/otplib/package.json
  # cp ./.npmignore ./builds/otplib/.npmignore
fi
