'use strict';

var now = require('@splitsoftware/splitio-utils/lib/now');

function Timer(collector) {
  return function start() {
    var st = now();

    return function stop() {
      var et = now() - st;

      collector.track(et);

      return et;
    };
  };
}

module.exports = Timer;
//# sourceMappingURL=Timer.js.map