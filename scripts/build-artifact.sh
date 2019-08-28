#!/bin/bash

if [ ! -d "builds/otplib" ]; then
  npm run build
fi

postfix=$(git rev-parse --short HEAD)
pkg_version="0.0.0-ci.${postfix}"

echo "--- updating package.json to $pkg_version ---"
npx json -I -f builds/otplib/package.json -e "this.version=\"$pkg_version\""
