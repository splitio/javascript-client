'use strict';

let matcherTypes = require('../../../lib/matchers/types');
let matcherFactory = require('../../../lib/matchers');
let tape = require('tape');

tape('Matcher ALL should always return true', function (assert) {

  let matcher = matcherFactory({
    type: matcherTypes.enum.ALL,
    value: undefined
  });

  assert.true(matcher('somekey'), '"somekey" should be true');
  assert.true(matcher('another key'), '"another key" should be true');
  assert.end();

});
