const tape = require('tape');
const now = require('../../../lib/now');

tape('NOW / should generate a value each time you call it', assert => {
  let n1 = now();
  let n2 = now();
  let n3 = now();

  assert.true(Number.isFinite(n1), 'is a finite value?');
  assert.true(Number.isFinite(n2), 'is a finite value?');
  assert.true(Number.isFinite(n3), 'is a finite value?');
  assert.end();
});
