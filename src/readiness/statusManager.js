import logFactory from '../utils/logger';
const log = logFactory('', { displayAllErrors: true });

const NEW_LISTENER_EVENT = 'newListener';
const REMOVE_LISTENER_EVENT = 'removeListener';

export default function callbackHandlerContext(context, forSharedClient = false) {
  const gate = context.get(context.constants.READINESS).gate;
  let readyCbCount = 0;
  let isReady = false;
  let isTimedout = false;
  const {
    SDK_READY,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  gate.once(SDK_READY, () => {
    if (readyCbCount === 0) log.warn('No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.');

    context.put(context.constants.READY, true);

    isReady = true;
  });

  gate.once(SDK_READY_TIMED_OUT, () => {
    isTimedout = true;
  });

  gate.on(REMOVE_LISTENER_EVENT, event => {
    if (event === SDK_READY) readyCbCount--;
  });

  gate.on(NEW_LISTENER_EVENT, event => {
    if (event === SDK_READY || event === SDK_READY_TIMED_OUT) {
      if (isReady) {
        log.error(`A listener was added for ${event === SDK_READY ? 'SDK_READY' : 'SDK_READY_TIMED_OUT'} on the SDK, which has already fired and won't be emitted again. The callback won't be executed.`);
      } else if (event === SDK_READY) {
        readyCbCount++;
      }
    }
  });

  function generateReadyPromise() {
    let hasCatch = false;
    const promise = new Promise((resolve, reject) => {
      if (isReady) {
        resolve();
      } else {
        if (isTimedout) {
          reject();
        } else {
          gate.once(SDK_READY, resolve);
          gate.once(SDK_READY_TIMED_OUT, reject);
        }
      }
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

      const promiseToReturn = originalThen.apply(this, arguments);
      promiseToReturn.then = promise.then;
      return promiseToReturn;
    };

    return promise;
  }

  function getReadyPromise() {
    if (forSharedClient) {
      return Promise.resolve();
    }

    // Non-shared clients use the full blown ready promise implementation.
    return generateReadyPromise();
  }

  return Object.assign(
    // Expose Event Emitter functionality
    Object.create(gate),
    {
      // Expose the event constants without changing the interface
      Event: {
        SDK_READY,
        SDK_UPDATE,
        SDK_READY_TIMED_OUT,
      },
      // Expose the ready promise flag
      ready: () => {
        return getReadyPromise();
      }
    }
  );
}

