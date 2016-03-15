/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

const Split = require('@splitsoftware/splitio-engine');

function SplitsStorage() {
  this.storage = new Map();
}

SplitsStorage.prototype.update = function (updates :Array<Split>) :void {

  updates.forEach(split => {
    if (!split.isGarbage()) {
      this.storage.set(split.getKey(), split);
    } else {
      this.storage.delete(split.getKey());
    }
  });

};

SplitsStorage.prototype.get = function (splitName :string) :? Split {
  return this.storage.get(splitName);
};

// @TODO optimize this query to be cached after each update
SplitsStorage.prototype.getSegments = function () :Set {
  let mergedSegmentNames = new Set();

  for(let split of this.storage.values()) {
    mergedSegmentNames = new Set([...mergedSegmentNames, ...(split.getSegments())]);
  }

  return mergedSegmentNames;
};

SplitsStorage.prototype.toJSON = function () :Map {
  return this.storage;
};

module.exports = SplitsStorage;
