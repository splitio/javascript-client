import tape from 'tape-catch';
import timeout from '../../promise/timeout';
import { SplitTimeoutError } from '../../lang/Errors';

const baseTimeoutInMs = 20;
const resolutionValue = 'random_Value';

tape('Promise utils / timeout - What happens in the event of a timeout or no timeout at all', async function (assert) {
  const prom = new Promise(() => {});

  assert.equal(timeout(0, prom), prom, 'If we set the timeout with a value less than 1, we just get the original promise (no timeout).');
  assert.equal(timeout(-1, prom), prom, 'If we set the timeout with a value less than 1, we just get the original promise (no timeout).');

  prom.then(
    () => assert.fail('This should not execute'),
    () => {
      assert.pass('This should execute on timeout expiration.');
    }
  );

  const ts = Date.now();
  const wrapperProm = timeout(baseTimeoutInMs, prom);

  assert.notEqual(wrapperProm, prom, 'If we actually set a timeout it should return a wrapping promise.');

  try {
    // This should be rejected after 10ms
    await wrapperProm;
    assert.fail('Should not execute');
  } catch (error) {
    // The promise was rejected not resolved. Give it an error margin of 10ms since it's not predictable
    assert.ok((Date.now() - ts) < baseTimeoutInMs + 20, 'The timeout should have rejected the promise.');
    assert.ok(error instanceof SplitTimeoutError, 'The timeout should have rejected the promise with a Split Timeout Error.');
    assert.end();
  }
});

tape('Promise utils / timeout - What happens if the promise resolves before the timeout.', async function (assert) {
  let promiseResolver = null;
  const prom = new Promise(res => { promiseResolver = res; });
  const wrapperProm = timeout(baseTimeoutInMs * 100, prom);

  assert.notEqual(wrapperProm, prom, 'If we actually set a timeout it should return a wrapping promise.');

  setTimeout(() => {
    // Resolve the promise before the timeout
    promiseResolver(resolutionValue);
  }, baseTimeoutInMs * 10);

  // This one should not reject but be resolved
  try {
    // await prom;
    const result = await wrapperProm;

    assert.equal(result, resolutionValue, 'The wrapper should resolve to the same value the original promise resolves.');

    assert.end();
  } catch (error) {
    assert.fail('Should not execute');
  }
});

tape('Promise utils / timeout - What happens if the promise rejects before the timeout.', async function (assert) {
  let promiseRejecter = null;
  const prom = new Promise((res, rej) => { promiseRejecter = rej; });
  const wrapperProm = timeout(baseTimeoutInMs * 100, prom);

  assert.notEqual(wrapperProm, prom, 'If we actually set a timeout it should return a wrapping promise.');

  setTimeout(() => {
    // Reject the promise before the timeout
    promiseRejecter(resolutionValue);
  }, baseTimeoutInMs * 10);

  // This one should not resolve but be rejected
  try {
    await wrapperProm;

    assert.fail('Should not execute');
  } catch (error) {
    assert.equal(error, resolutionValue, 'The wrapper should reject to the same error than the original promise.');

    assert.end();
  }
});
