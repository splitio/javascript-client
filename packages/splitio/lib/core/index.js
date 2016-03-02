/* @flow */'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var SchedulerFactory = require('@splitsoftware/splitio-utils/lib/scheduler');
var settings = require('@splitsoftware/splitio-utils/lib/settings');

var _require = require('@splitsoftware/splitio-cache');

var splitChangesUpdater = _require.splitChangesUpdater;
var segmentsUpdater = _require.segmentsUpdater;


var metrics = require('@splitsoftware/splitio-metrics');

var _isStarted = false;
var core = {
  start: function start() {
    if (!_isStarted) {
      _isStarted = true;
    } else {
      return _promise2.default.reject('Engine already started');
    }

    var coreSettings = settings.get('core');
    var featuresRefreshRate = settings.get('featuresRefreshRate');
    var segmentsRefreshRate = settings.get('segmentsRefreshRate');

    var splitRefreshScheduler = SchedulerFactory();
    var segmentsRefreshScheduler = SchedulerFactory();

    return _promise2.default.all([splitRefreshScheduler.forever(splitChangesUpdater, featuresRefreshRate, coreSettings), segmentsRefreshScheduler.forever(segmentsUpdater, segmentsRefreshRate, coreSettings)]).then(function (_ref) {
      var _ref2 = (0, _slicedToArray3.default)(_ref, 1);

      var storage = _ref2[0];

      return storage;
    });
  },
  isStared: function isStared() {
    return _isStarted;
  }
};

module.exports = core;
//# sourceMappingURL=index.js.map