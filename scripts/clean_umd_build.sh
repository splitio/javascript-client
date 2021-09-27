#!/bin/bash

# remove unfetch source mapping url from UMD development build
replace '//# sourceMappingURL=unfetch.module.js.map' '' ./umd -r

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi
