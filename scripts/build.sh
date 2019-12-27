#!/bin/bash
echo "\n[[ cleaning prev builds ]]"
npm run clean

echo "\n[[ building library ]]"
npx lerna run build:lib

if [ "$OTPLIB_BUILD_SKIP_TYPEDEF" == "true" ]; then
  echo "\n[[ skipping typedef ]]"
else
  echo "\n[[ building typedef ]]"
  npx lerna run build:typedef
fi
