const log = require('debug')('splitio-cache:segments');

function SegmentsStorage() {
  this.storage = new Map();
}

// @TODO in a near future I need to support merging strategy
SegmentsStorage.prototype.update = function (name :string, segment :Set) :void {
  log(`Updating segment ${name} with ${segment.size} keys`);

  this.storage.set(name, segment);
};

SegmentsStorage.prototype.get = function (name :string) :Set {
  return this.storage.get(name) || new Set();
};

SegmentsStorage.prototype.toJSON = function () :Map {
  return this.storage;
};

module.exports = SegmentsStorage;
