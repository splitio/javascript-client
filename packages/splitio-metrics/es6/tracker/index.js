'use strict';

let now = require('../utils/now');

function TrackerFactory(collector) {
  return function start() {
    let st = now();

    return function stop() {
      let et = now() - st;

      collector.track(et);

      return et;
    };
  };
}

module.exports = TrackerFactory;
