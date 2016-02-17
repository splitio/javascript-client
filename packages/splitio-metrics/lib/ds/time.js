/* @flow */'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('isomorphic-fetch');

var url = require('../url');

/*::
  type TimeRequest = {
    authorizationKey: string,
    dto: TimeDTO
  }
*/
function timeDataSource(_ref /*: TimeRequest */) /*: Promise */{
  var authorizationKey = _ref.authorizationKey;
  var dto = _ref.dto;

  return fetch(url('/time'), {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authorizationKey
    },
    body: (0, _stringify2.default)(dto)
  });
}

module.exports = timeDataSource;
//# sourceMappingURL=time.js.map