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
