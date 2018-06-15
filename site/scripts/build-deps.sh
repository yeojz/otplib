echo "--- building parent dependencies ---"
cd ..

echo "- create browser bundles"
NODE_ENV=production npm run build:bundles  > /dev/null

echo "- creating doc folder"
npm run build:docs > /dev/null

cd site
