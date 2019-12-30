#!/bin/bash

for i in "$@"
do
case $i in
    --skip-install=*)
    SKIP_INSTALL="${i#*=}"
    shift # past argument=value
    ;;
    *)
          # unknown option
    ;;
esac
done

if [ "$SKIP_INSTALL" == "true" ]; then
  echo "[[ installing and build npm package ]] - skip"
else
  echo "[[ installing and build npm package ]]"
  npm run setup

  NODE_ENV=production npm run build
fi

echo "[[ cleaning prev site builds ]]"
npx rimraf \
  ./builds/typedocs \
  ./website/static/otplib-browser \
  ./website/static/docs \
  ./website/static/api \
  ./website/public

echo "[[ copying bundle to website ]]"
cp -r ./packages/otplib-preset-browser/builds/. ./website/static/otplib-browser

echo "[[ building api docs ]]"
npx typedoc \
  --hideGenerator \
  --options ./configs/typedoc.json \
  --out ./builds/typedocs \
  --name otplib

echo "[[ copying api docs to website ]]"
cp -r ./builds/typedocs/. ./website/static/api

echo "[[ changing to website folder ]]"
cd website

if [ "$SKIP_INSTALL" == "true" ]; then
  echo "[[ installing website node_modules ]] - skip"
else
  echo "[[ installing website node_modules ]]"
  npm ci;
fi

npm run build
