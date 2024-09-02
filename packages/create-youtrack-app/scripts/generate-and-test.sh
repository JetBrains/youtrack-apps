#!/bin/bash
set -e -x

rm -rf ./tmp

# Generate test app
bash scripts/generate-test-app.sh

# Prepare test app
cd tmp
npm i

# Check and build test app
npm run lint
npm run test
npm run build


# Verify
if [ -d "tmp/dist" ]; then
    echo "Dist folder exists"
else
    echo "Dist folder does not exist"
    exit 333;
fi
