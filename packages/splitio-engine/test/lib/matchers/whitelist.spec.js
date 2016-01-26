'use strict';

var matcherTypes = require('../../../lib/matchers/types');
var matcherFactory = require('../../../lib/matchers');
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
//# sourceMappingURL=whitelist.spec.js.map