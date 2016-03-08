var pkg = require('./package.json');

module.exports = function(config) {
  'use strict';

  if (!process.env.SAUCE_USERNAME || !process.env.SAUCE_ACCESS_KEY) {
    console.log('Make sure the SAUCE_USERNAME and SAUCE_ACCESS_KEY environment variables are set.')
    process.exit(1)
  }

  // Example set of browsers to run on Sauce Labs
  // Check out https://saucelabs.com/platforms for all browser/platform combos
  var customLaunchers = {
    // sl_chrome_48_w7: {
    //   base: 'SauceLabs',
    //   browserName: 'chrome',
    //   platform: 'Windows 7',
    //   version: '48'
    // },
    // sl_chrome_47_w7: {
    //   base: 'SauceLabs',
    //   browserName: 'chrome',
    //   platform: 'Windows 7',
    //   version: '47'
    // },
    // sl_chrome_48_w10: {
    //   base: 'SauceLabs',
    //   browserName: 'chrome',
    //   platform: 'Windows 10',
    //   version: '48'
    // },
    // sl_chrome_47_w10: {
    //   base: 'SauceLabs',
    //   browserName: 'chrome',
    //   platform: 'Windows 10',
    //   version: '47'
    // },
    //
    // sl_ie_edge_w10: {
    //   base: 'SauceLabs',
    //   browserName: 'MicrosoftEdge',
    //   platform: 'Windows 10',
    //   version: '20.10240'
    // },
    // sl_ie_11_w10: {
    //   base: 'SauceLabs',
    //   browserName: 'internet explorer',
    //   platform: 'Windows 10',
    //   version: '11'
    // },
    // sl_ie_11_w7: {
    //   base: 'SauceLabs',
    //   browserName: 'internet explorer',
    //   platform: 'Windows 7',
    //   version: '11'
    // },
    // sl_ie_10_w7: {
    //   base: 'SauceLabs',
    //   browserName: 'internet explorer',
    //   platform: 'Windows 7',
    //   version: '10'
    // },
    sl_ie_9_w7: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '9'
    }
  };

  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [ 'browserify', 'tap' ],

    // list of files / patterns to load in the browser
    files: [
      'test/lib/**/*.spec.js'
    ],

    // list of files / patterns to exclude
    exclude: [
      'test/lib/**/node.spec.js',
      'test/lib/engine/utils.spec.js'
    ],

    // browserify all the tests
    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      transform: [ 'brfs' ]
    },

    // Which plugins to enable
    plugins: [
      'karma-sauce-launcher',
      'karma-tap',
      'karma-browserify'
    ],

    reporters: ['progress', 'saucelabs'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_DEBUG,
    sauceLabs: {
      testName: `${pkg.name} - ${pkg.version}`,
      recordScreenshots: false,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      },
      public: 'public'
    },
    // Increase timeout in case connection in CI is slow
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    singleRun: true
  });
};
