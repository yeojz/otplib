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

echo "\nrunning tests for $TYPE..."
npm run test:runner -- tests/builds/$TYPE
