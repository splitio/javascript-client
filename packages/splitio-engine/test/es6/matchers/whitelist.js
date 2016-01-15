'use strict';

var matcherTypes = require('splitio-engine/src/matchers/types');
var matcherFactory = require('splitio-engine/src/matchers');
var tape = require('tape');

tape('Matcher WHITELIST should return true ONLY when the key is defined', function (assert) {

  var matcher = matcherFactory({
    type: matcherTypes.enum.WHITELIST,
    value: new Set().add('key')
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another key'), '"another key" should be false');
  assert.end();

});
