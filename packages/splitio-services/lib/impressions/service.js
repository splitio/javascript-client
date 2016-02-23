'use strict';

function ImpressionsContext(Transport) {
  return function ImpressionsFetch(request) {
    return Transport(request);
  };
}

module.exports = ImpressionsContext;
//# sourceMappingURL=service.js.map