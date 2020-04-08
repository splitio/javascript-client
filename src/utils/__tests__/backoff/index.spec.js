import tape from 'tape';

import Backoff from '../../backoff';

tape('Backoff', assert => {

  let start = Date.now();
  let backoff;

  const callback = () => {
    const delta = Date.now() - start;
    start += delta;
    const expectedMillis = Math.min(backoff.baseMillis * Math.pow(2, backoff.attempts - 1), backoff.maxMillis);

    assert.true(delta > expectedMillis - 20 && delta < expectedMillis + 20, 'executes callback at expected time');
    if (backoff.attempts <= 3) {
      backoff.scheduleCall();
    } else {
      backoff.reset();
      assert.equal(backoff.attempts, 0, 'restarts attempts when `reset` called');
      assert.end();
    }
  };

  backoff = new Backoff(callback);
  assert.equal(backoff.cb, callback, 'contains given callback');
  assert.equal(backoff.baseMillis, Backoff.DEFAULT_BASE_MILLIS, 'contains default baseMillis');
  assert.equal(backoff.maxMillis, Backoff.DEFAULT_MAX_MILLIS, 'contains default maxMillis');

  const CUSTOM_BASE = 200;
  const CUSTOM_MAX = 700;
  backoff = new Backoff(callback, CUSTOM_BASE, CUSTOM_MAX);
  assert.equal(backoff.baseMillis, CUSTOM_BASE, 'contains given baseMillis');
  assert.equal(backoff.maxMillis, CUSTOM_MAX, 'contains given maxMillis');

  backoff.scheduleCall();
});