/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

const istanbul = require('browserify-istanbul');
const browserifyCoverageTransform = istanbul({
  ignore: [ '**/*.spec.js' ]
});

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    // autoWatch: true,
    //
    // watchify: {
    //   poll: true
    // },

    // base path, that will be used to resolve files and exclude
    basePath: '',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      'browserify',
      'tap'
    ],

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
      transform: [ browserifyCoverageTransform ]
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
      'Chrome',
      'Firefox',
      'Safari',
      'PhantomJS'
    ],

    // Which plugins to enable
    plugins: [
      'karma-*'
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: true,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    coverageReporter: {
      type : 'html',
      dir : 'karma_coverage/'
    },

    reporters: [
      'coverage'
    ]
  });
};
