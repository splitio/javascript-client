"use strict";

function Context(Transport) {
  return function Fetcher(request) {
    return Transport(request);
  };
}

module.exports = Context;
//# sourceMappingURL=service.js.map