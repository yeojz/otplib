# Generate file dependants
npm run build:browser
npm run build:docs

# Build within site directory
cd site
npm install
npm run clean
npm run build
npm run deploy

cd ..
