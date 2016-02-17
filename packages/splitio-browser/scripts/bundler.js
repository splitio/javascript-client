'use strict';

var browserify = require('browserify');
var fs = require('fs');
var envify = require('envify/custom');
var uglify = require('uglify-js');
var strStream = require('string-to-stream')
var src;
var bundlePath;

function minify(bundlePath) {
  return uglify.minify(bundlePath, {
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
    mangle: true,
    reserved: {
      vars: [/*'global', 'splitio'*/],
      props: ['splitio', 'isOn']
    }
  });
}

var dev = browserify({
  debug: true
});
bundlePath = require.resolve('../bundle/development.js');
dev.add('./lib/index.js');
dev.transform(envify({
     _: 'purge',
     NODE_ENV: 'development'
   }))
   .bundle()
   .pipe(fs.createWriteStream(bundlePath));

var prod = browserify();
bundlePath = require.resolve('../bundle/production.js');
prod.add('./lib/index.js');
prod.plugin('bundle-collapser/plugin')
    .transform(envify({
      _: 'purge',
      NODE_ENV: 'production'
    }))
    .bundle()
    .pipe(fs.createWriteStream(bundlePath))
    .on('finish', function afterSaveContentMinify() {
      strStream(minify(bundlePath).code)
        .pipe(fs.createWriteStream(bundlePath));
    });
