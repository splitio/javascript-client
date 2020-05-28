import promiseWrapper from '../utils/promise/wrapper';
import logFactory from '../utils/logger';
const log = logFactory('');

const NEW_LISTENER_EVENT = 'newListener';
const REMOVE_LISTENER_EVENT = 'removeListener';

// default onRejected handler, that just logs the error, if ready promise doesn't have one.
function defaultOnRejected(err) {
  log.error(err);
}

/**
 * StatusManager factory.
 * Responsable of exposing public status API: ready promise, event emitter and constants (SDK_READY, etc).
 * It also updates client context according to status events and logs related warnings and errors.
 *
 * @param {Object} context client context
 * @param {number} internalReadyCbCount number of SDK_READY listeners that are added/removed internally
 */
export default function callbackHandlerContext(context, internalReadyCbCount = 0) {
  const { gate, splits } = context.get(context.constants.READINESS);
  let readyCbCount = 0;
  const {
    SDK_READY,
    SDK_READY_FROM_CACHE,
    SDK_UPDATE,
    SDK_READY_TIMED_OUT
  } = gate;

  gate.on(REMOVE_LISTENER_EVENT, event => {
    if (event === SDK_READY) readyCbCount--;
  });

  gate.on(NEW_LISTENER_EVENT, event => {
    if (event === SDK_READY || event === SDK_READY_TIMED_OUT) {
      if (context.get(context.constants.READY, true)) {
        log.error(`A listener was added for ${event === SDK_READY ? 'SDK_READY' : 'SDK_READY_TIMED_OUT'} on the SDK, which has already fired and won't be emitted again. The callback won't be executed.`);
      } else if (event === SDK_READY) {
        readyCbCount++;
      }
    }
  });

  const readyPromise = generateReadyPromise();

  if(splits.splitsCacheLoaded) {
    context.put(context.constants.READY_FROM_CACHE, true);
  } else {
    gate.once(SDK_READY_FROM_CACHE, () => {
      log.info('Split SDK is ready from cache.');

      context.put(context.constants.READY_FROM_CACHE, true);
    });
  }

  function generateReadyPromise() {
    const promise = promiseWrapper(new Promise((resolve, reject) => {
      gate.once(SDK_READY, () => {
        if (readyCbCount === internalReadyCbCount && !promise.hasOnFulfilled()) log.warn('No listeners for SDK Readiness detected. Incorrect control treatments could have been logged if you called getTreatment/s while the SDK was not yet ready.');
        context.put(context.constants.READY, true);
        resolve();
      });
      gate.once(SDK_READY_TIMED_OUT, (error) => {
        context.put(context.constants.HAS_TIMEDOUT, true);
        reject(error);
      });
    }), defaultOnRejected);

    return promise;
  }

  return Object.assign(
    // Expose Event Emitter functionality
    Object.create(gate),
    {
      // Expose the event constants without changing the interface
      Event: {
        SDK_READY,
        SDK_READY_FROM_CACHE,
        SDK_UPDATE,
        SDK_READY_TIMED_OUT,
      },
      // Expose the ready promise flag
      ready: () => {
        if (context.get(context.constants.HAS_TIMEDOUT, true)) {
          if (!context.get(context.constants.READY, true)) {
            return promiseWrapper(Promise.reject('Split SDK has emitted SDK_READY_TIMED_OUT event.'), defaultOnRejected);
          } else {
            return Promise.resolve();
          }
        }
        return readyPromise;
      },
      // Expose methods to access client status synchronously
      // @TODO add tests for next methods
      isReady() { return context.get(context.constants.READY, true) || false; },
      isReadyFromCache() { return context.get(context.constants.READY_FROM_CACHE, true) || false; },
      hasTimedout() { return context.get(context.constants.HAS_TIMEDOUT, true) || false; },
      isDestroyed() { return context.get(context.constants.DESTROYED, true) || false; }
    }
  );
}