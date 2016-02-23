/* @flow */'use strict';

require('isomorphic-fetch');

function BasicRequest() {
  return function RequestFactory(request /*: Request */) /*: Promise */{
    return fetch(request);
  };
}

module.exports = BasicRequest;
//# sourceMappingURL=basic.js.map