'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var url = require('@splitsoftware/splitio-utils/lib/url');
var settings = require('@splitsoftware/splitio-utils/lib/settings');

function RequestFactory(relativeUrl, params) {
  var apiToken = settings.get('authorizationKey');
  var sdkVersion = settings.get('version');

  return new Request(url(relativeUrl), (0, _assign2.default)({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiToken,
      'SplitSDKVersion': '' + sdkVersion
    },
    mode: 'cors'
  }, params));
}

module.exports = RequestFactory;
//# sourceMappingURL=index.js.map