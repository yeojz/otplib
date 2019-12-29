#!/bin/bash

echo "[[ setting up dependencies ]]"
npx lerna bootstrap --ci --hoist

./scripts/download-buffer.sh
