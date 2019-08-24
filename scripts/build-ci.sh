echo "\n--- cleaning prev builds ---"
npx rimraf \
  builds/otplib

echo "\n--- building typedef ---"
npx tsc \
  --emitDeclarationOnly \
  -p ./configs/tsconfig.json

echo "\n--- modifying file paths ---"
node ./scripts/renameDir.js
node ./scripts/updateContent \
  typedef \
  ./builds/otplib/**/*.d.ts

echo "\n--- build modules ---"
NODE_ENV=production npx rollup \
  -c ./configs/rollup.config.js

echo "\n--- build bundles ---"
NODE_ENV=production npx webpack \
  --config ./configs/webpack.config.js
