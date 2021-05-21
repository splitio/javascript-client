import tape from 'tape-catch';

import { getFnName } from '../../lang';

// Unit testing this util only in node, because `test-browser-ci` script minifies the function name making the test fail.
tape('LANG UTILS / getFnName', function (assert) {
  function name1() { }

  assert.equal(getFnName(name1), 'name1', 'Should retrieve the function name.');
  assert.equal(getFnName(Array.prototype.push), 'push', 'Should retrieve the function name.');

  assert.end();
});