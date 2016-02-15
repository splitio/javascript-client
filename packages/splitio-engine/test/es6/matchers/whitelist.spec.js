'use strict';

let matcherTypes = require('../../../lib/matchers/types');
let matcherFactory = require('../../../lib/matchers');
let tape = require('tape');

tape('MATCHER WHITELIST / should return true ONLY when the key is defined', function (assert) {

  let matcher = matcherFactory({
    type: matcherTypes.enum.WHITELIST,
    value: new Set().add('key')
  });

  assert.true(matcher('key'), '"key" should be true');
  assert.false(matcher('another key'), '"another key" should be false');
  assert.end();

});
