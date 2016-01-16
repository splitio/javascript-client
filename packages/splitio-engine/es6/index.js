'use strict';

/**
@TODO

1- `getKey()` is actually `getFeatureName()` which is unique in the context of
   a given SPLIT_TOKEN. This key is used inside a data structure used for fast
   retrival. Evaluate if make sense to rename it or not.

**/

var parser = require('./parser/condition');

class Split {

  constructor(baseInfo, evaluator, segments) {
    this.baseInfo = baseInfo;
    this.evaluator = evaluator;
    this.segments = segments;
  }

  getKey() {
    return this.baseInfo.name;
  }

  getSegments() {
    return this.segments;
  }

  isOn(key) {
    return this.evaluator(key, this.baseInfo.seed);
  }

  static parse(splitFlatStructure) {
    let {conditions, ...baseInfo} = splitFlatStructure;
    let {evaluator, segments} = parser(conditions);

    return new Split(baseInfo, evaluator, segments);
  }

}

module.exports = Split;
