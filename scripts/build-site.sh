# Generate file dependants
yarn run build:browser
yarn run build:docs

# Build within site directory
cd site
yarn install
yarn run clean
yarn run build
yarn run deploy

cd ..
