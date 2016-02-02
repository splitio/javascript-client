'use strict';

require('babel-polyfill');

const TREATMENT = require('../treatments/reserved');
let parser = require('./parser/condition');

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

  getTreatment(key) {
    if (this.baseInfo.killed) {
      return TREATMENT.CONTROL;
    }

    return this.evaluator(key, this.baseInfo.seed);
  }

  isOn(key) {
    return TREATMENT.isON(this.getTreatment(key));
  }

  isGarbage() {
    return this.baseInfo.status === 'ARCHIVED';
  }

  static parse(splitFlatStructure) {
    let {conditions, ...baseInfo} = splitFlatStructure;
    let {evaluator, segments} = parser(conditions);

    return new Split(baseInfo, evaluator, segments);
  }

}

module.exports = Split;
