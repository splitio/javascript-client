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
'use strict';

class SplitsStorage {
  constructor() {
    this.storage = new Map();
  }

  update(updates /*: Array<Split> */) /*: void */ {
    // I'm not deleting splits because we should continue updating segments
    // doesn't matter if:
    // 1- no more splits reference to the segment
    // 2- the user delete the segment on the server
    //
    // Basically we are keeping garbage till we restart the SDK.
    for (let split of updates) {
      this.storage.set(split.getKey(), split);
    }
  }

  get(splitKey /*: string */) /*:? Split */ {
    return this.storage.get(splitKey);
  }

  getSegments() /*: Set */ {
    let mergedSegmentNames = new Set();

    for (const split of this.storage.values()) {
      mergedSegmentNames = new Set([...mergedSegmentNames, ...(split.getSegments())]);
    }

    return mergedSegmentNames;
  }

  toJSON() /*: string */ {
    return this.storage.toJSON();
  }

  get size() {
    return this.storage.size;
  }
}

module.exports = SplitsStorage;
