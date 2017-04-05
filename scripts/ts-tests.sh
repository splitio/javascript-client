#!/bin/bash

clear
cd ts-tests ## Go to typescript tests folder
echo "Installing dependencies for TypeScript declarations testing..."
npm install ## Install dependencies
echo "Dependencies installed, running tsc compiler."
tsc ## Run typescript compiler. No need for flags as we have a tsconfig.json file

if [ $? -eq 0 ]
then
  echo "Successfully compiled TS tests."
  exit 0
else
  echo "Error compiling TS tests."
  exit 1
fi
