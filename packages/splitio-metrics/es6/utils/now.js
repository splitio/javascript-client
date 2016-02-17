'use strict';

module.exports = (function () {
  if (typeof performance === 'object' && typeof performance.now === 'function') {
    return function now() {
      return Math.round(performance.now()); // round it to milis
    }
  } else if (typeof process === 'object' && typeof hrtime === 'function') {
    return function now() {
      return process.hrtime[0] * 1e3; // convert it to milis
    }
  } else {
    return Date.now; // milis from 1970
  }
}());
