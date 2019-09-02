# !/bin/bash

if [ ! -d "builds/otplib" ]; then
  npm run build
fi

npx rimraf builds/artifacts
mkdir -p builds/artifacts

postfix=$(git rev-parse --short HEAD)
pkg_version="0.0.0-master.${postfix}"

echo "--- updating package.json to $pkg_version ---"
npx json -I -f builds/packages/package.json -e "this.version=\"$pkg_version\""

tar -C "builds/packages" -czvf "builds/artifacts/otplib-master-${postfix}.tar.gz" .
