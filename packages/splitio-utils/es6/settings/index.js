
/*::
  type Settings = {
    core: {
      authorizationKey: string,
      key: ?string
    },
    scheduler: {
      featuresRefreshRate: number,
      segmentsRefreshRate: number,
      metricsRefreshRate: number,
      impressionsRefreshRate: number
    }
  };
*/
function defaults(custom /*: Settings */) /*: Settings */ {
  let init = {
    core: {
      authorizationKey: undefined,   // API token (tight to an environment)
      key: undefined                 // user key in your system (only required for browser version).
    },
    scheduler: {
      featuresRefreshRate: 60000,    // milis (1min)
      segmentsRefreshRate: 60000,    // milis (1min)
      metricsRefreshRate: 300000,    // milis (5min)
      impressionsRefreshRate: 300000 // milis (5min)
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

  if (typeof final.scheduler.impressionsRefreshRate !== 'number') {
    final.scheduler.impressionsRefreshRate = init.scheduler.impressionsRefreshRate;
  }

  // return an object with all the magic on it

  return final;
}

let settings = null;

module.exports = {
  configure(params) {
    settings = defaults(params);

    return this;
  },

  get(settingName) {
    if (!settings) {
      throw Error('Asked for configurations before they were defined');
    }

    switch (settingName) {
      case 'version':
        return 'javascript-0.29.0';
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
      case 'impressionsRefreshRate':
        return settings.scheduler.impressionsRefreshRate;
    }
  }
};
