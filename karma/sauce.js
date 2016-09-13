'use strict';

const pkg = require('../package.json');
const assign = require('lodash/assign');

// Example set of browsers to run on Sauce Labs
// Check out https://saucelabs.com/platforms for all browser/platform combos
const customLaunchers = {
  // Chrome 53, 52 for windows 10 y 7
  // sl_chrome_53_w7: {
  //   base: 'SauceLabs',
  //   browserName: 'chrome',
  //   platform: 'Windows 7',
  //   version: '53'
  // },
  // sl_chrome_52_w7: {
  //   base: 'SauceLabs',
  //   browserName: 'chrome',
  //   platform: 'Windows 7',
  //   version: '52'
  // },
  // sl_chrome_53_w10: {
  //   base: 'SauceLabs',
  //   browserName: 'chrome',
  //   platform: 'Windows 10',
  //   version: '53'
  // },
  // sl_chrome_52_w10: {
  //   base: 'SauceLabs',
  //   browserName: 'chrome',
  //   platform: 'Windows 10',
  //   version: '52'
  // },

  // IE 9, 10, 11, Edge for windows 10 y 7
  sl_ie_edge_w10: {
    base: 'SauceLabs',
    browserName: 'MicrosoftEdge',
    platform: 'Windows 10'
  },
  sl_ie_11_w10: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 10'
  },
  sl_ie_11_w7: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '11'
  },
  sl_ie_10_w7: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '10'
  },
  sl_ie_9_w7: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '9'
  },

  // Firefox 48 y 47 for windows 10 y 7
  // sl_ff_48_w7: {
  //   base: 'SauceLabs',
  //   browserName: 'firefox',
  //   platform: 'Windows 7',
  //   version: '48'
  // },
  // sl_ff_47_w7: {
  //   base: 'SauceLabs',
  //   browserName: 'firefox',
  //   platform: 'Windows 7',
  //   version: '47'
  // },
  // sl_ff_48_w10: {
  //   base: 'SauceLabs',
  //   browserName: 'firefox',
  //   platform: 'Windows 10',
  //   version: '48'
  // },
  // sl_ff_47_w10: {
  //   base: 'SauceLabs',
  //   browserName: 'firefox',
  //   platform: 'Windows 10',
  //   version: '47'
  // },

  // Safari 9, 8 y 7
  // sl_sf_9: {
  //   base: 'SauceLabs',
  //   browserName: 'safari',
  //   platform: 'OS X 10.11',
  //   version: '9'
  // },
  // sl_sf_8: {
  //   base: 'SauceLabs',
  //   browserName: 'safari',
  //   platform: 'OS X 10.10',
  //   version: '8'
  // },
  // sl_sf_7: {
  //   base: 'SauceLabs',
  //   browserName: 'safari',
  //   platform: 'OS X 10.9',
  //   version: '7'
  // }
};

module.exports = assign({}, require('./config'), {
  reporters: ['progress', 'saucelabs'],

  sauceLabs: {
    testName: `${pkg.name} - ${pkg.version}`,
    recordScreenshots: false,
    connectOptions: {
      port: 5757,
      logfile: 'sauce_connect.log'
    },
    public: 'public'
  },

  customLaunchers: customLaunchers,

  browsers: Object.keys(customLaunchers),

  singleRun: true,

  // All these values are based on experimentation, SAUCELABs has
  // really big delays on startup, and could fail if we increase
  // concurrency to more than 2.
  concurrency: 2,
  browserDisconnectTimeout: 10000, // default 2000
  browserDisconnectTolerance: 1, // default 0
  browserNoActivityTimeout: 4*60*1000, //default 10000
  captureTimeout: 4*60*1000 //default 60000
});
