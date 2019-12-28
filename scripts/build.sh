#!/bin/bash
echo "[[ cleaning prev builds ]]"
npm run clean

echo "[[ building library ]]"
npx lerna run build:lib

echo "[[ building typedef ]]"
npx lerna run build:typedef
