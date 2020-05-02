import eventsBulkRequest from '../services/events/bulk';
import eventsService from '../services/events';
import impressionsBulkRequest from '../services/impressions/bulk';
import impressionsService from '../services/impressions';
import { fromImpressionsCollector } from '../services/impressions/dto';
import logFactory from '../utils/logger';

const log = logFactory('splitio-client:cleanup');

// 'unload' event is used instead of 'beforeunload', since 'unload' is not a cancelable event, so no other listeners can stop the event from occurring.
const UNLOAD_DOM_EVENT = 'unload';

/**
 * We'll listen for 'unload' event over the window object, since it's the standard way to listen page reload and close.
 *
 */
export default class BrowserSignalListener {

  constructor(context) {
    this.storage = context.get(context.constants.STORAGE);
    this.settings = context.get(context.constants.SETTINGS);
    this.flushData = this.flushData.bind(this);
  }

  /**
   * start method. 
   * Called when SplitFactory is initialized. 
   * We add a handler on unload events. The handler flushes remaining impressions and events to the backend.
   */
  start() {
    if (window && window.addEventListener) {
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
    if (window && window.removeEventListener) {
      log.debug('Deregistering flush handler when unload page event is triggered.');
      window.removeEventListener(UNLOAD_DOM_EVENT, this.flushData);
    }
  }

  /**
   * _flushData method. 
   * Called when unload event is triggered. It flushed remaining impressions and events to the backend, 
   * using beacon API if possible, or falling back to XHR.
   */ 
  flushData() {
    this._flushImpressions();
    this._flushEvents();
  }

  _flushImpressions() {
    const impressions = this.storage.impressions;
    // if there are impressions in storage, send them to backend
    if (!impressions.isEmpty()) {
      const url = this.settings.url('/testImpressions/beacon');
      const impressionsPayload = fromImpressionsCollector(impressions, this.settings);
      if (!this._sendBeacon(url, impressionsPayload)) {
        impressionsService(impressionsBulkRequest(this.settings, { body: JSON.stringify(impressionsPayload) }));
      }
      impressions.clear();
    }
  }

  _flushEvents(){
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
  _sendBeacon(url, data) {
    if (navigator && navigator.sendBeacon) {
      const payload = JSON.stringify({
        entries: data,
        token: this.settings.core.authorizationKey,
        sdk: this.settings.version
      });
      return navigator.sendBeacon(url, payload);
    }
    return false;
  }
}
