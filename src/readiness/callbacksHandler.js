import logFactory from '../utils/logger';
const log = logFactory('', { displayAllErrors: true });

const NEW_LISTENER_EVENT = 'newListener';
const REMOVE_LISTENER_EVENT = 'removeListener';

export default function callbackHandlerContext(gate) {
  let readyCbCount = 0;
  let isReady = false;

  gate.once(gate.SDK_READY, () => {
    if (readyCbCount === 0) log.warn('No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.');

    isReady = true;
  });

  gate.on(REMOVE_LISTENER_EVENT, event => {
    if (event === gate.SDK_READY) readyCbCount--;
  });

  gate.on(NEW_LISTENER_EVENT, event => {
    if (event === gate.SDK_READY || event === gate.SDK_READY_TIMED_OUT) {
      if (isReady) {
        log.error(`A listener was added for ${event === gate.SDK_READY ? 'SDK_READY' : 'SDK_READY_TIMED_OUT'} on the SDK, which has already fired and won't be emitted again. The callback won't be executed.`);
      } else if (event === gate.SDK_READY) {
        readyCbCount++;
      }
    }
  });

  function generateReadyPromise() {
    let hasCatch = false;
    const promise = new Promise((resolve, reject) => {
      gate.once(gate.SDK_READY, resolve);
      gate.once(gate.SDK_READY_TIMED_OUT, reject);
    }).catch(function(err) {
      // If the promise has a custom error handler, just propagate
      if (hasCatch) throw err;
      // If not handle the error to prevent unhandled promise exception.
      log.error(err);
    });
    const originalThen = promise.then;

    // Using .catch(fn) is the same than using .then(null, fn)
    promise.then = function () {
      if (arguments.length > 0 && typeof arguments[0] === 'function')
        readyCbCount++;
      if (arguments.length > 1 && typeof arguments[1] === 'function')
        hasCatch = true;

      return originalThen.apply(this, arguments);
    };

    return promise;
  }

  function getReadyPromise(forSharedClient) {
    if (forSharedClient) {
      return Promise.resolve();
    }

    // Non-shared clients use the full blown ready promise implementation.
    return generateReadyPromise();
  }

  return getReadyPromise;
}

