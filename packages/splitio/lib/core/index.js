/* @flow */'use strict';

var cacheFacade = require('@splitsoftware/splitio-cache');
var schedulerFactory = require('../scheduler');

function defaults(params) {
  var def = Object.assign({
    cache: {
      authorizationKey: undefined,
      key: undefined
    },
    scheduler: {
      featuresRefreshRate: 60000,
      segmentsRefreshRate: 60000 * 3
    }
  }, params);

  if (typeof def.cache.authorizationKey !== 'string') {
    throw Error('Please provide an authorization token to startup the engine');
  }

  if (typeof def.scheduler.featuresRefreshRate !== 'number') {
    throw TypeError('featuresRefreshRate should be a number of miliseconds');
  }

  if (typeof def.scheduler.segmentsRefreshRate !== 'number') {
    throw TypeError('segmentsRefreshRate should be a number of miliseconds');
  }

  return def;
}

var _isStarted = false;
var _splitRefreshScheduler = undefined;
var _segmentsRefreshScheduler = undefined;

var core = {
  start: function start(options) {
    if (!_isStarted) {
      _isStarted = true;
    } else {
      return Promise.reject('Engine already started');
    }

    try {
      options = defaults(options);
    } catch (error) {
      return Promise.reject(error);
    }

    var _options = options;
    var cache = _options.cache;
    var _options$scheduler = _options.scheduler;
    var featuresRefreshRate = _options$scheduler.featuresRefreshRate;
    var segmentsRefreshRate = _options$scheduler.segmentsRefreshRate;

    _splitRefreshScheduler = schedulerFactory();
    _segmentsRefreshScheduler = schedulerFactory();

    return _splitRefreshScheduler.forever(cacheFacade.splitChangesUpdater, featuresRefreshRate, cache).then(function () {
      return _segmentsRefreshScheduler.forever(cacheFacade.segmentsUpdater, segmentsRefreshRate, cache);
    });
  },
  isStared: function isStared() {
    return _isStarted;
  }
};

module.exports = core;
//# sourceMappingURL=index.js.map