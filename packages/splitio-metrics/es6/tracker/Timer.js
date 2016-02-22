'use strict';

let now = require('@splitsoftware/splitio-utils/lib/now');

function Timer(collector) {
  return function start() {
    let st = now();

    return function stop() {
      let et = now() - st;

      collector.track(et);

      return et;
    };
  };
}

module.exports = Timer;
