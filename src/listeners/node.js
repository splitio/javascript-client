import logFactory from '../utils/logger';
import thenable from '../utils/promise/thenable';
const log = logFactory('splitio-client:cleanup');

/**
 * We'll listen for SIGTERM since it's the standard signal for server shutdown.
 *
 * If you're stopping the execution yourself via the keyboard, or by calling process.exit,
 * you should call the cleanup logic yourself, since we cannot ensure the data is sent after
 * the process is already exiting.
 */
export default class NodeSignalListener {
  constructor() {
    this._sigtermHandler = this._sigtermHandler.bind(this);
  }

  start(handler) {
    this.handler = handler;

    log.debug('Registering cleanup handlers.');
    process.on('SIGTERM', this._sigtermHandler);
  }

  stop() {
    log.debug('Deregistering cleanup handlers.');
    process.removeListener('SIGTERM', this._sigtermHandler);
  }

  /**
   * Call the handler, clean up listeners and emit the signal again.
   */
  _sigtermHandler() {
    const wrapUp = () => {
      // Cleaned up, remove handlers.
      this.stop();

      // This handler prevented the default behaviour, start again.
      process.kill(process.pid, 'SIGTERM');
    };

    log.debug('Split SDK graceful shutdown after SIGTERM.');

    let handlerResult = null;

    try {
      handlerResult = this.handler();
    } catch (err) {
      log.error(`Error with Split graceful shutdown: ${err}`);
    }

    if (thenable(handlerResult)) {
      // Always exit, even with errors. The promise is returned for UT purposses.
      return handlerResult.then(wrapUp).catch(wrapUp);
    } else {
      wrapUp();
    }
  }
}

