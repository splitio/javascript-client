'use strict';

// @TODO 'bundle-collapser/plugin' <= generates a bug with Object.assign

const fs = require('fs');
const path = require('path');
const touch = require('touch');
const mkdirp = require('mkdirp');

const browserify = require('browserify');
const envify = require('envify/custom');
const uglify = require('uglify-js');
const strStream = require('string-to-stream');

const splitPkg = require('../node_modules/@splitsoftware/splitio/package');
const offlineSplitSource = path.resolve(path.join(__dirname, '../node_modules/@splitsoftware/splitio/lib/offline.js'));
const onlineSplitSource = path.resolve(path.join(__dirname, '../node_modules/@splitsoftware/splitio/lib/browser.js'));

const bundlesDir = path.resolve(path.join(__dirname, `../lib`));
const offlineBundlePath = path.resolve(path.join(bundlesDir, `offline-${splitPkg.version}.js`));
const debugBundlePath = path.resolve(path.join(bundlesDir, `debug-${splitPkg.version}.js`));
const onlineBundlePath = path.resolve(path.join(bundlesDir, `online-${splitPkg.version}.js`));

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
touch.sync(offlineBundlePath);
touch.sync(debugBundlePath);
touch.sync(onlineBundlePath);

// Offline bundle
const offline = browserify();
offline.add(offlineSplitSource);
offline.transform(envify({
    _: 'purge',
    NODE_ENV: 'production'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(offlineBundlePath))
      .on('finish', function minifyAfterSave() {
        strStream(minify(offlineBundlePath).code)
          .pipe(fs.createWriteStream(offlineBundlePath));
      });

const dev = browserify({ debug: true });
dev.add(onlineSplitSource);
dev.transform(envify({
    _: 'purge',
    NODE_ENV: 'production'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(debugBundlePath));

const prod = browserify();
prod.add(onlineSplitSource);
prod.transform(envify({
    _: 'purge',
    NODE_ENV: 'production'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(onlineBundlePath))
      .on('finish', function minifyAfterSave() {
        strStream(minify(onlineBundlePath, {
          drop_console: true
        }).code).pipe(fs.createWriteStream(onlineBundlePath));
      });
