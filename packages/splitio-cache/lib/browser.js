/* @flow */'use strict';

try {
  require('babel-polyfill');
} catch (e) {/* will be replaced using just core-js */}

exports.splitChangesUpdater = require('./updater/splitChanges');
exports.segmentsUpdater = require('./updater/mySegments');
//# sourceMappingURL=browser.js.map