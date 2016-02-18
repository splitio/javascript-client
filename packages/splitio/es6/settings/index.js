'use strict';

/*::
  type Settings = {
    core: {
      authorizationKey: string,
      key: ?string
    },
    scheduler: {
      featuresRefreshRate: number,
      segmentsRefreshRate: number,
      metricsRefreshRate: number
    }
  }
*/
function defaults(custom /*: Settings */) /*: Settings */ {
  let init = {
    core: {
      authorizationKey: undefined,   // API token (tight to an environment)
      key: undefined                 // user key in your system (only required for browser version).
    },
    scheduler: {
      featuresRefreshRate: 30000, // miliseconds
      segmentsRefreshRate: 40000, // miliseconds
      metricsRefreshRate: 300000  // miliseconds (randomly choosen based on this initial rate).
    }
  };

  let final = Object.assign({}, init, custom);

  // we can't start the engine without the authorization token.

  if (typeof final.core.authorizationKey !== 'string') {
    throw Error('Please provide an authorization token to startup the engine');
  }

  // override invalid values with default ones

  if (typeof final.scheduler.featuresRefreshRate !== 'number') {
    final.scheduler.featuresRefreshRate = init.scheduler.featuresRefreshRate;
  }

  if (typeof final.scheduler.segmentsRefreshRate !== 'number') {
    final.scheduler.segmentsRefreshRate = init.scheduler.segmentsRefreshRate;
  }

  if (typeof final.scheduler.metricsRefreshRate !== 'number') {
    final.scheduler.metricsRefreshRate = init.scheduler.metricsRefreshRate;
  }

  // return an object with all the magic on it

  return final;
}

let settings = null;

module.exports = {
  configure(params) {
    settings = defaults(params);
  },

  get(settingName) {
    switch (settingName) {
      case 'core':
        return settings.core;
      case 'scheduler':
        return settings.scheduler;
      case 'authorizationKey':
        return settings.core.authorizationKey;
      case 'key':
        return settings.core.key;
      case 'featuresRefreshRate':
        return settings.scheduler.featuresRefreshRate;
      case 'segmentsRefreshRate':
        return settings.scheduler.segmentsRefreshRate;
      case 'metricsRefreshRate':
        return settings.scheduler.metricsRefreshRate;
    }
  }
};
