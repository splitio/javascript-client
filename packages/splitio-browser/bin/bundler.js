#!/usr/bin/env node

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

'use strict';

// @TODO 'bundle-collapser/plugin' <= generates a bug with Object.assign

process.stdout.on('error', process.exit);

const exec = require('child_process').execSync;
const fs = require('fs');
const path = require('path');
const touch = require('touch');
const mkdirp = require('mkdirp');

const browserify = require('browserify');
const envify = require('envify/custom');
const uglify = require('uglify-js');
const strStream = require('string-to-stream');

const splitPkg = require('@splitsoftware/splitio/package');

const splitSource = require.resolve('@splitsoftware/splitio/lib/browser.js');

const bundlesDir = path.resolve(path.join(process.cwd(), `splitio`));

const debugBundlePath = path.resolve(path.join(bundlesDir, `split-${splitPkg.version}.js`));
const productionBundlePath = path.resolve(path.join(bundlesDir, `split-${splitPkg.version}.min.js`));

function minify(bundlePath, customUglifySetting) {
  return uglify.minify(bundlePath, Object.assign({
    compress: {
      sequences     : true,
      properties    : true,
      dead_code     : true,
      drop_debugger : true,
      unsafe        : false,
      unsafe_comps  : false,
      conditionals  : true,
      comparisons   : true,
      evaluate      : true,
      booleans      : true,
      loops         : true,
      unused        : true,
      hoist_funs    : true,
      keep_fargs    : true,
      keep_fnames   : false,
      hoist_vars    : false,
      if_return     : true,
      join_vars     : true,
      cascade       : true,
      side_effects  : true,
      pure_getters  : false,
      pure_funcs    : null,
      negate_iife   : true,
      screw_ie8     : true,
      drop_console  : false,
      angular       : false,
      warnings      : true
    },
    mangle: true
  }, customUglifySetting));
}

// be sure we have the files created before start
mkdirp.sync(bundlesDir, '0777');
touch.sync(debugBundlePath);
touch.sync(productionBundlePath);

const debug = browserify({ debug: true });
debug.add(splitSource);
debug.transform(envify({
    _: 'purge',
    NODE_ENV: 'development'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(debugBundlePath));

const prod = browserify();
prod.add(splitSource);
prod.transform(envify({
    _: 'purge',
    NODE_ENV: 'production'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(productionBundlePath))
      .on('finish', function minifyAfterSave() {
        strStream(minify(productionBundlePath, {
          drop_console: true
        }).code)
          .pipe(fs.createWriteStream(productionBundlePath))
          .on('finish', function addCopyrights() {
            exec(`cat ${path.join(__dirname, '..', 'COPYRIGHT.txt')} > ${productionBundlePath}.tmp`);
            exec(`cat ${productionBundlePath} >> ${productionBundlePath}.tmp`);
            exec(`mv ${productionBundlePath}.tmp ${productionBundlePath}`);
          });
      });
