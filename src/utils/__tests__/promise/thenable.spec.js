import tape from 'tape-catch';
import thenable from '../../promise/thenable';

tape('Promise utils / thenable', assert => {
  const prom = new Promise(() => {});
  const promResolved = Promise.resolve();
  const promRejected = Promise.reject();
  const thenableThing = { then: () => {} };
  const nonThenableThing = { then: 'not a function' };

  assert.true(thenable(prom), 'Promises and thenable-like objects should pass the test.');
  assert.true(thenable(promResolved), 'Promises and thenable-like objects should pass the test.');
  assert.true(thenable(promRejected), 'Promises and thenable-like objects should pass the test.');
  assert.true(thenable(thenableThing), 'Promises and thenable-like objects should pass the test.');

  assert.false(thenable(nonThenableThing), 'Non thenable objects should fail the test.');
  assert.false(thenable('string'), 'Non thenable objects should fail the test.');
  assert.false(thenable(123), 'Non thenable objects should fail the test.');
  assert.false(thenable({}), 'Non thenable objects should fail the test.');
  assert.false(thenable({ catch: () => {} }), 'Non thenable objects should fail the test.');
  assert.false(thenable([prom, promResolved]), 'Non thenable objects should fail the test.');
  assert.false(thenable(() => {}), 'Non thenable objects should fail the test.');

  assert.end();
});
