./scripts/build-ci.sh

echo "\n--- downloading buffer module ---"
curl https://bundle.run/buffer@5.3.0 \
  --output ./builds/otplib/preset-browser/buffer.js

echo "\n--- copying meta ---"
cp ./README.md ./builds/otplib/README.md
cp ./LICENSE ./builds/otplib/LICENSE
cp ./package.json ./builds/otplib/package.json
cp ./.npmignore ./builds/otplib/.npmignore
