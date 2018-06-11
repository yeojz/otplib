# packaging
npm run build:module
npm run build:transpile
NODE_ENV=production npm run build:browser
cp README.md dist/README.md
cp LICENSE dist/LICENSE
# npm essentials
cp package.json dist/package.json
cp .npmignore dist/.npmignore
cp scripts/.npmrc dist/.npmrc
