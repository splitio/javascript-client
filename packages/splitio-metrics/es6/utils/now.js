'use strict';

// @TODO separate now for nodejs from the browser because browserify adds
// useless overhead to the final bundle

module.exports = (function () {
  if (typeof performance === 'object' && typeof performance.now === 'function') {
    return performance.now.bind(performance);
  } else if (typeof process === 'object' && typeof hrtime === 'function') {
    return function now() {
      return process.hrtime[0] * 1e3 + process.hrtime[1] * 1e-3; // convert it to milis
    }
  } else {
    return Date.now; // milis from 1970
  }
}());
