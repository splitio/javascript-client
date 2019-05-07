import tape from 'tape-catch';
import { SplitError, SplitNetworkError, SplitTimeoutError } from '../../lang/Errors';

tape('Language utils / Errors', assert => {
  const splitErrorInst = new SplitError(); // This one should not be used directly, so only testing default message
  let splitNetErrorInst = new SplitNetworkError();
  let splitTimeErrorInst = new SplitTimeoutError();

  assert.equal(splitErrorInst.message, 'Split Error', 'The errors should have a default message.');
  assert.equal(splitNetErrorInst.message, 'Split Network Error', 'The errors should have a default message.');
  assert.equal(splitTimeErrorInst.message, 'Split Timeout Error', 'The errors should have a default message.');

  splitNetErrorInst = new SplitNetworkError('NETWORK_ERR', 341);

  assert.equal(splitNetErrorInst.message, 'NETWORK_ERR', 'Split Network Error should store params (message) correctly');
  assert.equal(splitNetErrorInst.statusCode, 341, 'Split Network Error should store params (status code) correctly');
  assert.true(splitNetErrorInst instanceof SplitError, 'All custom errors should extend from the root one');
  assert.true(splitNetErrorInst instanceof Error, 'All custom errors should extend from the native one.');

  splitTimeErrorInst = new SplitTimeoutError('TIMEOUT_ERR');

  assert.equal(splitTimeErrorInst.message, 'TIMEOUT_ERR', 'Split Network Error should store params (message) correctly');
  assert.true(splitTimeErrorInst instanceof SplitError, 'All custom errors should extend from the root one.');
  assert.true(splitTimeErrorInst instanceof Error, 'All custom errors should extend from the native one.');

  assert.end();
});
