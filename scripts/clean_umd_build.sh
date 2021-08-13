#!/bin/bash

# replace splitio-commons imports to use its ES modules build
replace '//# sourceMappingURL=unfetch.module.js.map' '' ./umd -r

if [ $? -eq 0 ]
then
  exit 0
else
  exit 1
fi
