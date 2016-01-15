'use strict';

var matcherTypes = require('splitio-engine/src/matchers/types');
var matcherFactory = require('splitio-engine/src/matchers');
var tape = require('tape');

tape('Matcher ALL should always return true', function (assert) {

  var matcher = matcherFactory({
    type: matcherTypes.enum.ALL,
    value: undefined
  });

  assert.true(matcher('somekey'), '"somekey" should be true');
  assert.true(matcher('another key'), '"another key" should be true');
  assert.end();

});
