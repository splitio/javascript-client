/**
 * wraps a given promise in a new one with a default onRejected function,
 * that handles the promise rejection if not other onRejected handler is provided.
 *
 * @param customPromise promise to wrap
 * @param defaultOnRejected default onRejected function
 * @returns a promise that doesn't need to be handled for rejection (except when using async/await syntax) and
 * with a method named `hasOnFulfilled` that returns true if the promise has attached an onFulfilled handler.
 */
export default function promiseWrapper(customPromise, defaultOnRejected) {

  let hasOnFulfilled = false;
  let hasOnRejected = false;

  function chain(promise) {
    const newPromise = new Promise((res, rej) => {
      return promise.then(
        res,
        function(value) {
          if (hasOnRejected) {
            rej(value);
          } else {
            defaultOnRejected(value);
          }
        },
      );
    });

    const originalThen = newPromise.then;

    newPromise.then = function(onfulfilled, onrejected) {
      const result = originalThen.call(newPromise, onfulfilled, onrejected);
      if (typeof onfulfilled === 'function') hasOnFulfilled = true;
      if (typeof onrejected === 'function') {
        hasOnRejected = true;
        return result;
      } else {
        return chain(result);
      }
    };

    return newPromise;
  }

  const result = chain(customPromise);
  result.hasOnFulfilled = () => hasOnFulfilled;
  return result;
}
