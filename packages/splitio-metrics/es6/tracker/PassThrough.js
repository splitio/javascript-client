'use strict';

function PassThrough(collector) {
  return function through(element) {
    collector.track(element);
  };
}

module.exports = PassThrough;
