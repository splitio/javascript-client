const parser = require('./parser');

function defaults(inst) {
  // in case we don't have a default treatment in the instanciation, use
  // 'control'
  if (typeof inst.baseInfo.defaultTreatment !== 'string') {
    inst.baseInfo.defaultTreatment = 'control';
  }
}

function Split(baseInfo, evaluator, segments) {
  if (!(this instanceof Split)) {
     return new Split(baseInfo, evaluator, segments);
  }

  this.baseInfo = baseInfo;
  this.evaluator = evaluator;
  this.segments = segments;

  defaults(this);
}

Split.parse = function parse(splitFlatStructure, storage) {
  let {conditions, ...baseInfo} = splitFlatStructure;
  let {evaluator, segments} = parser(conditions, storage);

  return new Split(baseInfo, evaluator, segments);
}

Split.prototype.getKey = function getKey() {
  return this.baseInfo.name;
};

Split.prototype.getSegments = function getSegments() {
  return this.segments;
}

Split.prototype.getTreatment = function getTreatment(key) {
  if (this.baseInfo.killed) {
    return this.baseInfo.defaultTreatment;
  }

  let treatment = this.evaluator(key, this.baseInfo.seed);

  return treatment !== undefined ?
    treatment :
    this.baseInfo.defaultTreatment;
}

Split.prototype.isTreatment = function isTreatment(key, treatment) {
  return this.getTreatment(key) === treatment;
}

Split.prototype.isGarbage = function isGarbage() {
  return this.baseInfo.status === 'ARCHIVED';
}

module.exports = Split;
