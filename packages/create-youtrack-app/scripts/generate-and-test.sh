#!/bin/bash
set -e -x

rm -rf ./tmp

# Generate test app
bash scripts/generate-test-app.sh

# Prepare test app
cd tmp
npm i

# Check and build test app
npm run lint -- --fix
npm run test
npm run build
