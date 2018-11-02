import ioredis from 'ioredis';
import { merge, isString } from '../utils/lang';
import thenable from '../utils/promise/thenable';
import timeout from '../utils/promise/timeout';

import LogFactory from '../utils/logger';
const log = LogFactory('splitio-storage:adapter');

// If we ever decide to fully wrap every method, there's a Commander.getBuiltinCommands from ioredis.
const METHODS_TO_PROMISE_WRAP = ['set', 'exec', 'del', 'get', 'keys', 'sadd', 'srem', 'sismember', 'smembers', 'incr', 'rpush', 'pipeline'];

// Not part of the settings since it'll vary on each storage. We should be removing storage specific logic from elsewhere.
const DEFAULT_OPTIONS = {
  connectionTimeout: 10000,
  commandTimeout: 5000
};
// Library specifics.
const DEFAULT_LIBRARY_OPTIONS = {
  enableOfflineQueue: false,
  connectTimeout: DEFAULT_OPTIONS.connectionTimeout,
  lazyConnect: false
};

/**
 * Redis adapter on top of the library of choice (written with ioredis) for some extra control.
 */
export default class RedisAdapter extends ioredis {
  constructor(storageSettings) {
    const options = RedisAdapter._defineOptions(storageSettings);
    // Call the ioredis constructor
    super(...RedisAdapter._defineLibrarySettings(options));

    this._options = options;
    this._commandsQueue = [];
    this._listenToEvents();
    this._setTimeoutWrappers();
  }

  _listenToEvents() {
    this.once('ready', () => {
      const commandsCount = this._commandsQueue ? this._commandsQueue.length : 0;
      log.info(`Redis connection established. Queued commands: ${commandsCount}.`);
      commandsCount && this._commandsQueue.forEach(queued => {
        log.info(`Executing Redis ${queued.name} command.`);
        queued.command().then(queued.resolve).catch(queued.reject);
      });
      // After the SDK is ready for the first time we'll stop queueing commands. This is just so we can keep handling BUR for them.
      this._commandsQueue = false;
    });
    this.once('close', () => {
      log.warn('Redis connection closed.');
    });
  }

  _setTimeoutWrappers() {
    const instance = this;

    METHODS_TO_PROMISE_WRAP.forEach(method => {
      const originalMethod = instance[method];

      instance[method] = function() {
        const params = arguments;

        function commandWrapper() {
          // Return original method
          const result = originalMethod.apply(instance, params);

          if (thenable(result)) {
            return timeout(instance._options.commandTimeout, result).catch(err => {
              log.error(`Redis ${method} operation exceeded configured timeout of ${instance._options.commandTimeout}ms setting. Error: ${err}`);
              // Handling is not the adapter responsibility.
              throw err;
            });
          }

          return result;
        }

        if (instance._commandsQueue) {
          return new Promise((res, rej) => {
            instance._commandsQueue.unshift({
              resolve: res,
              reject: rej,
              command: commandWrapper,
              name: method.toUpperCase()
            });
          });
        } else {
          return commandWrapper();
        }
      };
    });
  }

  /**
   * Receives the options and returns an array of parameters for the ioredis constructor.
   * Keeping both redis setup options for backwards compatibility.
   */
  static _defineLibrarySettings(options) {
    const opts = merge({}, DEFAULT_LIBRARY_OPTIONS);
    const result = [opts];

    if (!isString(options.url)) {
      merge(opts, { // If it's not the string URL, merge the params separately.
        host: options.host,
        port: options.port,
        db: options.db,
        password: options.pass
      });
    } else { // If it IS the string URL, that'll be the first param for ioredis.
      result.unshift(options.url);
    }

    return result;
  }

  /**
   * Parses the options into what we care about.
   */
  static _defineOptions({ connectionTimeout, commandTimeout, url, host, port, db, pass }) {
    const parsedOptions = {
      connectionTimeout, commandTimeout, url, host, port, db, pass
    };

    return merge({}, DEFAULT_OPTIONS, parsedOptions);
  }
}
