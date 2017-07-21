#!/bin/bash

cd ts-tests ## Go to typescript tests folder
echo "Installing dependencies for TypeScript declarations testing..."
npm install ## Install dependencies
echo "Linking the @splitsoftware/splitio package."
npm link @splitsoftware/splitio ## Link to the cloned code
echo "Dependencies installed, running tsc compiler."
tsc ## Run typescript compiler. No need for flags as we have a tsconfig.json file

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
