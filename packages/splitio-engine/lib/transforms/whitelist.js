/* @flow */'use strict';

function transform(whitelistObject /*: Object */) /*: Set */{
  return new Set(whitelistObject.whitelist);
}

module.exports = transform;
//# sourceMappingURL=whitelist.js.map