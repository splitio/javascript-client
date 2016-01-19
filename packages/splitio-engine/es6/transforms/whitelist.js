/* @flow */ 'use strict';

function transform(whitelistObject /*: Array<string> */) /*: Set */ {
  return new Set(whitelistObject.whitelist);
}

module.exports = transform;
