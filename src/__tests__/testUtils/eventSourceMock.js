/**
 * EventEmitter mock based on https://github.com/gcedo/eventsourcemock/blob/master/src/EventSource.js
 *
 * To setup the mock assign it to the window object.
 * ```
 *  import EventSource from 'eventsourcemock';
 *  Object.defineProperty(window, 'EventSource', {
 *    value: EventSource,
 *  });
 * ```
 *
 */

import EventEmitter from 'events';

const defaultOptions = {
  withCredentials: false
};

export const sources = {};
let __listener;
export function setMockListener(listener) {
  __listener = listener;
}

export default class EventSource {

  constructor(
    url,
    eventSourceInitDict = defaultOptions
  ) {
    this.url = url;
    this.withCredentials = eventSourceInitDict.withCredentials;
    this.readyState = 0;
    // eslint-disable-next-line no-undef
    this.__emitter = new EventEmitter();
    this.__eventSourceInitDict = arguments[1];
    sources[url] = this;
    if (__listener) setTimeout(__listener, 0, this);
  }

  addEventListener(eventName, listener) {
    this.__emitter.addListener(eventName, listener);
  }

  removeEventListener(eventName, listener) {
    this.__emitter.removeListener(eventName, listener);
  }

  close() {
    this.readyState = 2;
  }

  // The following methods can be used to mock EventSource behavior and events
  emit(eventName, messageEvent) {
    this.__emitter.emit(eventName, messageEvent);

    let listener;
    switch (eventName) {
      case 'error': listener = this.onerror; break;
      case 'open': listener = this.onopen; break;
      case 'message': listener = this.onmessage; break;
    }
    if (typeof listener === 'function') {
      listener(messageEvent);
    }
  }

  emitError(error) {
    this.emit('error', error);
  }

  emitOpen() {
    this.readyState = 1;
    this.emit('open');
  }

  emitMessage(message) {
    this.emit('message', message);
  }
}

EventSource.CONNECTING = 0;
EventSource.OPEN = 1;
EventSource.CLOSED = 2;