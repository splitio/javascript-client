"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Thenable = undefined;

var _hasInstance = require("babel-runtime/core-js/symbol/has-instance");

var _hasInstance2 = _interopRequireDefault(_hasInstance);

var _defineProperty = require("babel-runtime/core-js/object/define-property");

var _defineProperty2 = _interopRequireDefault(_defineProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Thenable = exports.Thenable = function () {
  function Thenable(input) {
    return input != null && typeof input.then === 'function';
  }

  ;
  (0, _defineProperty2.default)(Thenable, _hasInstance2.default, {
    value: function value(input) {
      return Thenable(input);
    }
  });
  return Thenable;
}();
//# sourceMappingURL=index.js.map