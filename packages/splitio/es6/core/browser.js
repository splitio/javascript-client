/* @flow */ 'use strict';

let updater = require('@splitsoftware/splitio-cache');

function defaults(params) {
  let {
    cache: { authorizationKey },
    scheduler: { featuresRefreshRate = 60, segmentsRefreshRate = 60 }
  } = params;

  if (typeof authorizationKey !== 'string') {
    throw Error('Please provide an authorization token to startup the engine');
  }

  if (typeof featuresRefreshRate !== 'number') {
    throw TypeError('featuresRefreshRate should be a number of miliseconds');
  }

  if (typeof segmentsRefreshRate !== 'number') {
    throw TypeError('segmentsRefreshRate should be a number of miliseconds');
  }

  return {
    cache,
    scheduler: {
      featuresRefreshRate,
      segmentsRefreshRate
    }
  };
}

let core = {
  schedule(fn /*: function */, delay /*: number */, ...params /*:? Array<any> */) {
    setTimeout(() => {
      fn(...params);
      this.schedule(fn, delay, ...params);
    }, delay);
  },

  start(options) {
    let {
      scheduler
    } = defaults(options);

    // the first start is fired manually, next once are handle by the scheduler
    // implementation.
    return updater().then(storage => {

      this.schedule(updater, 60000, ...args);

      return storage;
    });
  }
};

module.exports = core;
