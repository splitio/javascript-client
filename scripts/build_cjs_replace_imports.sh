#!/bin/bash

# replace splitio-commons imports to use ES modules
replace '@splitsoftware/splitio-commons/src' '@splitsoftware/splitio-commons/cjs' ./lib -r

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi
