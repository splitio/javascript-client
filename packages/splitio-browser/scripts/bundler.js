'use strict';

const browserify = require('browserify');
const fs = require('fs');
const envify = require('envify/custom');
const uglify = require('uglify-js');
const strStream = require('string-to-stream')

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

const offline = browserify();
const offlineBundlePath = require.resolve('../lib/offline.js');
offline.add('./node_modules/@splitsoftware/splitio/lib/offline.js');
/* offline.plugin('bundle-collapser/plugin') */
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
const developmentBundlePath = require.resolve('../lib/development.js');
dev.add('./node_modules/@splitsoftware/splitio/lib/browser.js');
dev.transform(envify({
    _: 'purge',
    NODE_ENV: 'development'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(developmentBundlePath));

const prod = browserify();
const productionBundlePath = require.resolve('../lib/production.js');
prod.add('./node_modules/@splitsoftware/splitio/lib/browser.js');
/* prod.plugin('bundle-collapser/plugin') <= generates a bug with Object.assign */
prod.transform(envify({
    _: 'purge',
    NODE_ENV: 'production'
  }), { global: true })
  .bundle()
    .pipe(fs.createWriteStream(productionBundlePath))
      .on('finish', function minifyAfterSave() {
        strStream(minify(productionBundlePath, {
          drop_console: true
        }).code).pipe(fs.createWriteStream(productionBundlePath));
      });
