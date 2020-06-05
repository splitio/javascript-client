import tape from 'tape-catch';
import promiseWrapper from '../../promise/wrapper';

tape('Promise utils / promise wrapper', function (assert) {
  assert.plan(31 + 19); // number of passHandler, passHandlerFinally, passHandlerWithThrow and `hasOnFulfilled` asserts

  const value = 'value';
  const failHandler = (val) => { assert.fail(val); };
  const passHandler = (val) => { assert.equal(val, value); return val; };
  const passHandlerFinally = () => { assert.pass(); };
  const passHandlerWithThrow = (val) => { assert.equal(val, value); throw val; };
  const createResolvedPromise = () => new Promise((res) => { setTimeout(() => { res(value); }, 100); });
  const createRejectedPromise = () => new Promise((_, rej) => { setTimeout(() => { rej(value); }, 100); });

  // resolved promises
  let wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), false);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler, failHandler).finally(passHandlerFinally);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).catch(failHandler).finally(passHandlerFinally);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).catch(failHandler).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).then(passHandler).catch(failHandler).finally(passHandlerFinally).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).then(passHandlerWithThrow).catch(passHandler).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  const wrappedPromise2 = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise2.then(() => {
    wrappedPromise2.then(passHandler);
  });
  assert.equal(wrappedPromise2.hasOnFulfilled(), true);

  Promise.all([
    promiseWrapper(createResolvedPromise(), failHandler),
    promiseWrapper(createResolvedPromise(), failHandler)]).then(passHandlerFinally());

  // rejected promises
  wrappedPromise = promiseWrapper(createRejectedPromise(), passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), false);

  wrappedPromise = promiseWrapper(createRejectedPromise(), passHandler);
  wrappedPromise.catch(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), false);

  wrappedPromise = promiseWrapper(createRejectedPromise(), passHandler);
  wrappedPromise.then(undefined, passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), false);

  wrappedPromise = promiseWrapper(createRejectedPromise(), passHandler);
  wrappedPromise.then(failHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createRejectedPromise(), failHandler);
  wrappedPromise.then(failHandler).then(failHandler).catch(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createRejectedPromise(), passHandler);
  wrappedPromise.then(failHandler).then(failHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createRejectedPromise(), failHandler);
  wrappedPromise.then(failHandler, passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createRejectedPromise(), failHandler);
  wrappedPromise.then(failHandler).catch(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createRejectedPromise(), failHandler);
  wrappedPromise.then(failHandler).then(failHandler, passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createRejectedPromise(), failHandler);
  wrappedPromise.then(failHandler).catch(passHandler).then(passHandler).finally(passHandlerFinally);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  const wrappedPromise3 = promiseWrapper(createRejectedPromise(), failHandler);
  wrappedPromise3.catch(() => {
    wrappedPromise3.catch(passHandler);
  });
  assert.equal(wrappedPromise3.hasOnFulfilled(), false);

  Promise.all([
    promiseWrapper(createResolvedPromise(), failHandler),
    promiseWrapper(createRejectedPromise(), failHandler)]).catch(passHandler);

  setTimeout(() => {
    assert.end();
  }, 1000);

});

tape('Promise utils / promise wrapper: async/await', async function (assert) {

  assert.plan(8); // number of passHandler and passHandlerWithThrow

  const value = 'value';
  const failHandler = (val) => { assert.fail(val); };
  const passHandler = (val) => { assert.equal(val, value); return val; };
  const passHandlerFinally = () => { assert.pass(); };
  const passHandlerWithThrow = (val) => { assert.equal(val, value); throw val; };
  const createResolvedPromise = () => new Promise((res) => { res(value); });
  const createRejectedPromise = () => new Promise((res, rej) => { rej(value); });

  try {
    const result = await promiseWrapper(createResolvedPromise(), failHandler);
    passHandler(result);
  } catch (result) {
    failHandler(result);
  } finally {
    passHandlerFinally();
  }

  try {
    const result = await promiseWrapper(createRejectedPromise(), failHandler);
    failHandler(result);
  } catch (result) {
    passHandler(result);
  }

  let result;
  try {
    result = await promiseWrapper(createResolvedPromise(), failHandler);
    passHandler(result);
    passHandlerWithThrow(result);
  } catch (error) {
    result = passHandler(error);
  } finally {
    passHandlerFinally();
  }
  passHandler(result);

  setTimeout(() => {
    assert.end();
  }, 1000);

});
