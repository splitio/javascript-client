import tape from 'tape';

import Backoff from '../../backoff';

tape('Backoff', assert => {

  let start = Date.now();
  let backoff;
  const callback = () => {
    const delta = Date.now() - start;
    start += delta;
    const expectedMillis = Backoff.DEFAULT_BASE_SECONDS * Math.pow(2, backoff.attempts - 1) * 1000;

    assert.true(delta > expectedMillis - 20 && delta < expectedMillis + 20, 'executes callback at expected time');
    if (backoff.attempts === 1) {
      backoff.scheduleCall();
    } else {
      backoff.reset();
      assert.equal(backoff.attempts, 0, 'restarts attempts when `reset` called');
      assert.end();
    }
  };

  const CUSTOM_BASE = 5;
  const CUSTOM_MAX = 10;
  backoff = new Backoff(callback, CUSTOM_BASE, CUSTOM_MAX);
  assert.equal(backoff.cb, callback, 'contains given callback');
  assert.equal(backoff.baseSec, CUSTOM_BASE, 'contains given baseSec');
  assert.equal(backoff.maxSec, CUSTOM_MAX, 'contains given maxSec');

  backoff = new Backoff(callback);
  assert.equal(backoff.baseSec, Backoff.DEFAULT_BASE_SECONDS, 'contains default baseSec');
  assert.equal(backoff.maxSec, Backoff.DEFAULT_MAX_SECONDS, 'contains default maxSec');

  backoff.scheduleCall();
});