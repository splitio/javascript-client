/* @flow */ 'use strict';

let cacheFacade = require('@splitsoftware/splitio-cache');
let schedulerFactory = require('../scheduler');

function defaults(params) {
  let def = Object.assign({
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

let _isStarted = false;
let _splitRefreshScheduler;
let _segmentsRefreshScheduler;

let core = {
  start(options) {
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

    let {
      cache,
      scheduler: {
        featuresRefreshRate,
        segmentsRefreshRate
      }
    } = options;

    _splitRefreshScheduler = schedulerFactory();
    _segmentsRefreshScheduler = schedulerFactory();

    return _splitRefreshScheduler.forever(
      cacheFacade.splitChangesUpdater,
      featuresRefreshRate,
      cache
    ).then(() => {
      return _segmentsRefreshScheduler.forever(
        cacheFacade.segmentsUpdater,
        segmentsRefreshRate,
        cache
      );
    });
  },

  isStared() {
    return _isStarted;
  }
};

module.exports = core;
