'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

module.exports = function () {
  if ((typeof performance === 'undefined' ? 'undefined' : _typeof(performance)) === 'object' && typeof performance.now === 'function') {
    return function now() {
      return Math.round(performance.now()); // round it to milis
    };
  } else if ((typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && typeof hrtime === 'function') {
      return function now() {
        return process.hrtime[0] * 1e3; // convert it to milis
      };
    } else {
        return Date.now; // milis from 1970
      }
}();
//# sourceMappingURL=now.js.map