'use strict';

module.exports = function () {
  return function now() {
    var time = process.hrtime();

    return time[0] * 1e3 + time[1] * 1e-3; // convert it to milis
  };
}();
//# sourceMappingURL=node.js.map