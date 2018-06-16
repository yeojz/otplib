echo "--- setting up ---"
echo "- removing artifacts..."
npm run clean > /dev/null

echo "- creating folders..."
mkdir -p ./dist
mkdir -p ./dist/.circleci
mkdir -p ./dist/lib
mkdir -p ./dist/js
mkdir -p ./dist/css

# Get package version
OTPLIB_VERSION=$(node -pe "require('../package.json').version")

echo "--- adding ---"
# Copy configs
if [ "$PUBLIC_URL" != "/" ]; then
  echo "- docs"
  cp -r ../dist/docs/otplib/${OTPLIB_VERSION} ./dist/docs

  echo "- circleci config"
  cp ./scripts/circleci-config.yml ./dist/.circleci/config.yml
fi

echo "- assets"
cp ../dist/otplib/otplib-browser.js  ./dist/lib/otplib-browser.js
cp ./node_modules/qrcode/build/qrcode.min.js ./dist/js/qrcode.min.js
cp ./public/otplib.png ./dist/otplib.png
cp ./public/favicon.ico ./dist/favicon.ico
cp ./public/style.css ./dist/css/style.css
cp ./public/app.js ./dist/js/app.js

echo "--- generating ---"
OTPLIB_VERSION=${OTPLIB_VERSION} node ./scripts/createIndexFile.js
