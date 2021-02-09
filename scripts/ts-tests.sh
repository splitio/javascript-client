#!/bin/bash

cd ts-tests ## Go to typescript tests folder
echo "Installing dependencies for TypeScript declarations testing..."
npm install ## Install dependencies
npm install @types/node@6.0.31 ## Install type definitions for Node.js v6.x (the oldest supported version)
echo "Dependencies installed, linking the package."
npm link @splitsoftware/splitio ## Link to the cloned code
echo "Running tsc compiler."
./node_modules/.bin/tsc ## Run typescript compiler. No need for flags as we have a tsconfig.json file

echo "Testing again with the latest @types/node version..."
npm install @types/node@14 ## Install latest type definitions for Node.js
echo "Dependencies installed, linking the package."
npm link @splitsoftware/splitio ## Link to the cloned code
echo "Running tsc compiler."
./node_modules/.bin/tsc ## Run typescript compiler. No need for flags as we have a tsconfig.json file

if [ $? -eq 0 ]
then
  echo "✅  Successfully compiled TS tests."
  npm unlink @splitsoftware/splitio
  exit 0
else
  echo "☠️  Error compiling TS tests."
  npm unlink @splitsoftware/splitio
  exit 1
fi
