#!/bin/bash

for i in "$@"
do
case $i in
    -t=*|--type=*)
    TYPE="${i#*=}"
    shift # past argument=value
    ;;
    *)
          # unknown option
    ;;
esac
done

echo "[[ running tests for $TYPE ]]"
npm run test:runner -- tests/extras/$TYPE
