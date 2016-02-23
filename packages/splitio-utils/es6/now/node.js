'use strict';

module.exports = (function () {
  return function now() {
    let time = process.hrtime();

    return time[0] * 1e3 + time[1] * 1e-3; // convert it to milis
  };
}());
