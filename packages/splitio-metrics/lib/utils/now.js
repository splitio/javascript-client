'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = function () {
  if ((typeof performance === 'undefined' ? 'undefined' : (0, _typeof3.default)(performance)) === 'object' && typeof performance.now === 'function') {
    return performance.now.bind(performance);
  } else if ((typeof process === 'undefined' ? 'undefined' : (0, _typeof3.default)(process)) === 'object' && typeof hrtime === 'function') {
    return function now() {
      return process.hrtime[0] * 1e3 + process.hrtime[1] * 1e-3; // convert it to milis
    };
  } else {
      return Date.now; // milis from 1970
    }
}();
//# sourceMappingURL=now.js.map