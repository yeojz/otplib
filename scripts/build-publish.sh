yarn run clean
yarn run build
echo -e "$NPM_USER\n$NPM_PASS\n$NPM_EMAIL" | npm login
cd dist
pwd
npm publish
npm logout
