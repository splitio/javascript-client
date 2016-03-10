const matcherTypes = require('../../../lib/matchers/types');
const matcherFactory = require('../../../lib/matchers');
const tape = require('tape');

tape('MATCHER ALL / should always return true', function (assert) {

  let matcher = matcherFactory({
    type: matcherTypes.enum.ALL,
    value: undefined
  });

  assert.true(matcher('somekey'), '"somekey" should be true');
  assert.true(matcher('another key'), '"another key" should be true');
  assert.end();

});
