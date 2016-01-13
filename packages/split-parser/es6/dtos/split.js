'use strict';

var parser = require('../parser/condition');

class SplitDTO {

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

  evaluate(key) {
    this.evalutor(key, this.baseInfo.seed);
  }

  static parse(splitFlatStructure) {
    let {conditions, ...baseInfo} = splitFlatStructure;
    let {evaluator, segments} = parser(conditions);

    return new SplitDTO(baseInfo, evaluator, segments);
  }

}

module.exports = SplitDTO;
