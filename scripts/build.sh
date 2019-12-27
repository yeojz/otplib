#!/bin/bash
echo "\n[[ cleaning prev builds ]]"
npm run clean

echo "\n[[ building library ]]"
npx lerna run build:lib

echo "\n[[ building typedef ]]"
npx lerna run build:typedef

