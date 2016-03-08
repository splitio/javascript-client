module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    watchify: {
      poll: true
    },

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

    preprocessors: {
      'test/**/*.js': [ 'browserify' ]
    },

    browserify: {
      debug: true,
      transform: [ 'brfs' ]
    },

    // web server port
    port: 8080,

    // make IE happy (in theory not required)
    // https://msdn.microsoft.com/en-us/library/ff955275(v=vs.85).aspx
    customHeaders: [{
      match: 'html',
      name: 'X-UA-Compatible',
      value: 'IE=edge'
    }],

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      //'PhantomJS'
    ],

    // Which plugins to enable
    plugins: [
      'karma-phantomjs-launcher',
      'karma-chrome-launcher',
      'karma-firefox-launcher',
      'karma-safari-launcher',
      'karma-tap',
      'karma-browserify'
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_DEBUG
  });
};
