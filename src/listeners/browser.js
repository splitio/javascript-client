import eventsBulkRequest from '../services/events/bulk';
import eventsService from '../services/events';
import impressionsBulkRequest from '../services/impressions/bulk';
import impressionsCountRequest from '../services/impressions/count';
import impressionsService from '../services/impressions';
import { fromImpressionsCollector, fromImpressionsCountCollector } from '../services/impressions/dto';
import logFactory from '../utils/logger';
import { OPTIMIZED, DEBUG } from '../utils/constants';
import objectAssign from 'object-assign';

const log = logFactory('splitio-client:cleanup');

// 'unload' event is used instead of 'beforeunload', since 'unload' is not a cancelable event, so no other listeners can stop the event from occurring.
const UNLOAD_DOM_EVENT = 'unload';

/**
 * We'll listen for 'unload' event over the window object, since it's the standard way to listen page reload and close.
 *
 */
export default class BrowserSignalListener {

  constructor(context, syncManager) {
    this.storage = context.get(context.constants.STORAGE);
    this.settings = context.get(context.constants.SETTINGS);
    this.syncManager = syncManager;
    this.flushData = this.flushData.bind(this);
    if (this.settings.sync.impressionsMode === OPTIMIZED) {
      this.impressionsCounter = context.get(context.constants.IMPRESSIONS_COUNTER);
    }
  }

  /**
   * start method.
   * Called when SplitFactory is initialized.
   * We add a handler on unload events. The handler flushes remaining impressions and events to the backend.
   */
  start() {
    if (typeof window !== 'undefined' && window.addEventListener) {
      log.debug('Registering flush handler when unload page event is triggered.');
      window.addEventListener(UNLOAD_DOM_EVENT, this.flushData);
    }
  }


  /**
   * stop method.
   * Called when client is destroyed.
   * We need to remove the handler for unload events, since it can break if called when Split context was destroyed.
   */
  stop() {
    if (typeof window !== 'undefined' && window.removeEventListener) {
      log.debug('Deregistering flush handler when unload page event is triggered.');
      window.removeEventListener(UNLOAD_DOM_EVENT, this.flushData);
    }
  }

  /**
   * _flushData method.
   * Called when unload event is triggered. It flushed remaining impressions and events to the backend,
   * using beacon API if possible, or falling back to regular post transport.
   */
  flushData() {
    this._flushImpressions();
    this._flushEvents();
    if (this.impressionsCounter) {
      this._flushImpressionsCount();
    }
    // Close streaming
    if (this.syncManager && this.syncManager.pushManager) this.syncManager.pushManager.stop();
  }

  _flushImpressions() {
    const impressions = this.storage.impressions;
    // if there are impressions in storage, send them to backend
    if (!impressions.isEmpty()) {
      const url = this.settings.url('/testImpressions/beacon');
      const impressionsPayload = fromImpressionsCollector(impressions, this.settings);
      const extraMetadata = {
        // sim stands for Sync/Split Impressions Mode
        sim: this.settings.sync.impressionsMode === OPTIMIZED ? OPTIMIZED : DEBUG
      };

      if (!this._sendBeacon(url, impressionsPayload, extraMetadata)) {
        impressionsService(impressionsBulkRequest(this.settings, { body: JSON.stringify(impressionsPayload) }));
      }
      impressions.clear();
    }
  }

  _flushImpressionsCount() {
    const impressionsCountPayload = { pf: fromImpressionsCountCollector(this.impressionsCounter) };
    const imprCounts = impressionsCountPayload.pf.length;
    if (imprCounts === 0) return;
    const url = this.settings.url('/testImpressions/count/beacon');
    if (!this._sendBeacon(url, impressionsCountPayload)) {
      impressionsService(impressionsCountRequest(this.settings, { body: JSON.stringify(impressionsCountPayload) }));
    }
  }

  _flushEvents() {
    const events = this.storage.events;
    // if there are events in storage, send them to backend
    if (!events.isEmpty()) {
      const url = this.settings.url('/events/beacon');
      const eventsPayload = events.toJSON();
      if (!this._sendBeacon(url, eventsPayload)) {
        eventsService(eventsBulkRequest(this.settings, { body: JSON.stringify(eventsPayload) }));
      }
      events.clear();
    }
  }

  /**
   * _sendBeacon method.
   * Util method that check if beacon API is available, build the payload and send it.
   */
  _sendBeacon(url, data, extraMetadata) {
    // eslint-disable-next-line compat/compat
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const json = {
        entries: data,
        token: this.settings.core.authorizationKey,
        sdk: this.settings.version,
      };

      // Extend with endpoint specific metadata where needed
      if (extraMetadata) objectAssign(json, extraMetadata);

      // Stringify the payload
      const payload = JSON.stringify(json);

      // eslint-disable-next-line compat/compat
      return navigator.sendBeacon(url, payload);
    }
    return false;
  }
}
