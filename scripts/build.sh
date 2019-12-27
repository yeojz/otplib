#!/bin/bash
echo "\n[[ cleaning prev builds ]]"
npm run clean



if [ "$OTPLIB_SETUP_TYPE" = "node8" ]; then
  echo "\n[[ Skipping some node 8 incompatible modules ]]"

  npx lerna run build:lib \
    --ignore @otplib/plugin-crypto-async-ronomon \
    --ignore @otplib/preset-default-async

else
  echo "\n[[ building library ]]"

  npx lerna run build:lib
fi

if [ "$OTPLIB_BUILD_SKIP_TYPEDEF" == "true" ]; then
  echo "\n[[ skipping typedef ]]"
else
  echo "\n[[ building typedef ]]"

  npx lerna run build:typedef
fi
