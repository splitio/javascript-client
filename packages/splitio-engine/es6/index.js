'use strict';

try { require('babel-polyfill'); } catch(e) { /* will be replaced using just core-js */ }

const TREATMENT = require('./treatments/reserved');
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
    return TREATMENT.isOn(this.getTreatment(key));
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
