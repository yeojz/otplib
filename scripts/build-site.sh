echo "\n--- cleaning prev builds ---"
npx rimraf \
  ./builds/typedocs \
  ./website/static/otplib-browser \
  ./website/static/docs

echo "\n--- building docs ---"
npx typedoc \
  --hideGenerator \
  --options ./configs/typedoc.json \
  --out ./builds/typedocs

echo "\n--- copying statics to website ---"
cp -r ./builds/otplib/preset-browser/. ./website/static/otplib-browser
cp -r ./builds/typedocs/. ./website/static/api
