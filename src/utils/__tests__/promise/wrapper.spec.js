import tape from 'tape-catch';
import promiseWrapper from '../../promise/wrapper';

tape('Promise utils / promise wrapper', function (assert) {
  assert.plan(23 + 17); // number of passHandler, passHandlerWithThrow and `hasOnFulfilled` asserts

  const value = 'value';
  const failHandler = (val) => { assert.fail(val); };
  const passHandler = (val) => { assert.equal(val, value); return val; };
  const passHandlerWithThrow = (val) => { assert.equal(val, value); throw val; };
  const createResolvedPromise = () => new Promise((res) => { setTimeout(()=>{res(value);}, 100); });
  const createRejectedPromise = () => new Promise((_, rej) => { setTimeout(()=>{rej(value);}, 100); });

  // resolved promises
  let wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), false);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler, failHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).catch(failHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).catch(failHandler).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).then(passHandler).catch(failHandler).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  wrappedPromise = promiseWrapper(createResolvedPromise(), failHandler);
  wrappedPromise.then(passHandler).then(passHandlerWithThrow).catch(passHandler).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

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
  wrappedPromise.then(failHandler).catch(passHandler).then(passHandler);
  assert.equal(wrappedPromise.hasOnFulfilled(), true);

  setTimeout(() => {
    assert.end();
  }, 1000);

});

tape('Promise utils / promise wrapper: async/await', async function (assert) {

  assert.plan(6); // number of passHandler and passHandlerWithThrow

  const value = 'value';
  const failHandler = (val) => { assert.fail(val); };
  const passHandler = (val) => { assert.equal(val, value); return val; };
  const passHandlerWithThrow = (val) => { assert.equal(val, value); throw val; };
  const createResolvedPromise = () => new Promise((res) => { res(value); });
  const createRejectedPromise = () => new Promise((res, rej) => { rej(value); });

  try {
    const result = await promiseWrapper(createResolvedPromise(), failHandler);
    passHandler(result);
  } catch(result) {
    failHandler(result);
  }

  try {
    const result = await promiseWrapper(createRejectedPromise(), failHandler);
    failHandler(result);
  } catch(result) {
    passHandler(result);
  }

  let result;
  try {
    result = await promiseWrapper(createResolvedPromise(), failHandler);
    passHandler(result);
    passHandlerWithThrow(result);
  } catch(error) {
    result = passHandler(error);
  }
  passHandler(result);

  setTimeout(() => {
    assert.end();
  }, 1000);

});