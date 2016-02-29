const log = require('debug')('splitio-cache:segments');

function SegmentsStorage() {
  this.storage = new Set();
}

SegmentsStorage.prototype.update = function (segments :Set) :void {
  log(`Updating my segments list with [${[...segments]}]`);

  this.storage = segments;
};

SegmentsStorage.prototype.has = function (name :string) :boolean {
  return this.storage.has(name);
};

SegmentsStorage.prototype.toJSON = function () {
  return this.storage;
};

module.exports = SegmentsStorage;
