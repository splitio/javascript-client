'use strict';

var engine = require('split-engine/es6');
var keys = require('../mocks/1000_keys_10_chart_length');

for (let k of keys) {
  console.log(engine.isOn(k, 424344136) % 100 + 1);
  // console.log(engine.isOn(k, -1208231323)  / Number.MAX_SAFE_INTEGER * 100);
}
