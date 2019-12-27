#!/bin/bash

if [ "$OTPLIB_TEST_BROWSER" == "true" ]; then
  echo "\n running tests in browser (puppeteer)..."
  npm run test:runner -- \
    tests/builds/browser
fi

if [ "$OTPLIB_TEST_README" == "true" ]; then
  echo "\n running tests for readme examples..."
  npm run test:runner -- \
    tests/builds/readme-
fi

if [ "$OTPLIB_TEST_COMPILED" == "true" ]; then
  echo "\n running tests on compiled code..."
  npm run test:runner -- \
    tests/builds/compiled-
fi
