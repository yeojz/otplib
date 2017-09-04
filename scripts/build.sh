yarn run build:module
yarn run build:transpile
NODE_ENV=production yarn run build:browser
cp README.md dist/README.md
cp LICENSE dist/LICENSE
cp package.json dist/package.json
cp yarn.lock dist/yarn.lock
cp .npmignore dist/.npmignore
