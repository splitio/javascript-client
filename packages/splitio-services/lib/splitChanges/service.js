'use strict';

function SplitChangesContext(Transport) {
  return function SplitChangesFetch(request) {
    return Transport(request);
  };
}

module.exports = SplitChangesContext;
//# sourceMappingURL=service.js.map