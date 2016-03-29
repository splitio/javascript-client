'use strict';

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/
module.exports = {
  enum: {
    ALL: (0, _symbol2.default)(),
    SEGMENT: (0, _symbol2.default)(),
    WHITELIST: (0, _symbol2.default)(),
    UNDEFINED: (0, _symbol2.default)()
  },

  mapper: function mapper(matcherType /*: string */) {
    var types = this.enum;

    switch (matcherType) {
      case 'ALL_KEYS':
        return types.ALL;
      case 'IN_SEGMENT':
        return types.SEGMENT;
      case 'WHITELIST':
        return types.WHITELIST;
      default:
        return types.UNDEFINED;
    }
  }
};
//# sourceMappingURL=types.js.map