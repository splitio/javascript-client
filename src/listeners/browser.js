import eventsBulkRequest from '../services/events/bulk';
import eventsService from '../services/events';
import impressionsBulkRequest from '../services/impressions/bulk';
import impressionsService from '../services/impressions';
import { fromImpressionsCollector } from '../services/impressions/dto';
import { STORAGE, SETTINGS } from '../utils/context/constants';
import logFactory from '../utils/logger';
const log = logFactory('splitio-client:cleanup');

/**
 * We'll listen for 'unload' event over the window object, since it's the standard way to listen page reload and close.
 *
 */
export default class BrowserSignalListener {
  constructor(context) {
    this.storage = context.get(STORAGE);
    this.settings = context.get(SETTINGS);
    this._flushEventsAndImpressions = this._flushEventsAndImpressions.bind(this);
    // this._sendBeacon = this._sendBeacon.bind(this); // not need of binding _sendBeacon
  }

  /**
   * start method. 
   * Called when SplitFactory is initialized. 
   * We add a handler on unload events. The handler flushes remaining impressions and events to the backend.
   */ 
  start() {
    log.debug('Registering flush handler when unload page event is triggered.');
    if (window && window.addEventListener) {
      window.addEventListener('unload', this._flushEventsAndImpressions);
    }  
  }


  /**
   * stop method. 
   * Called when client is destroyed. 
   * We need to remove the handler for unload events, since it can break if called when Split context was destroyed.
   */ 
  stop() {
    log.debug('Deregistering flush handler when unload page event is triggered.');
    if (window && window.addEventListener) {
      window.removeEventListener('unload', this._flushEventsAndImpressions);
    } 
  }

  /**
   * _flushEventsAndImpressions method. 
   * Called when unload event is triggered. It flushed remaining impressions and events to the backend, 
   * using beacon API if possible, or falling back to XHR.
   */ 
  _flushEventsAndImpressions() {
    // if there are impressions in storage, send them to backend
    if (!this.storage.impressions.isEmpty()) {
      const url = this.settings.url('/testImpressions/beacon');
      const impressions = fromImpressionsCollector(this.storage.impressions, this.settings);
      if (!this._sendBeacon(url, impressions))
        impressionsService(impressionsBulkRequest(this.settings, { data: JSON.stringify(impressions) }));
      this.storage.impressions.clear();
    }
    
    // if there are events in storage, send them to backend
    if (!this.storage.events.isEmpty()) {
      const url = this.settings.url('/events/beacon');
      const events = this.storage.events.toJSON();
      if (!this._sendBeacon(url, events))
        eventsService(eventsBulkRequest(this.settings, { data: JSON.stringify(events) }));
      this.storage.events.clear();
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
