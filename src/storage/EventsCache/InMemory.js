/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

'use strict';

const thenable = require('../../utils/promise/thenable');

class EventsCache {
  queue: Array<any>;
  maxQueue;
  onFullQueue;

  constructor(context) {
    const settings = context.get(context.constants.SETTINGS);
    const eventsModule = context.get(context.constants.EVENTS);

    this.onFullQueue = false;
    this.maxQueue = settings.scheduler.eventsQueueSize;
    this.queue = [];

    if (thenable(eventsModule)) {
      eventsModule.then(events => {
        this.onFullQueue = events.flushAndResetTimer;
        this._checkQueueSize(); // Events is ready, check the queue.
      });
    } else if (typeof eventsModule.flushAndResetTimer === 'function') {
      this.onFullQueue = eventsModule.flushAndResetTimer;
    }
  }

  /**
   * Get the current state of the queue.
   */
  state() {
    return this.queue;
  }

  /**
   * Add a new event object at the end of the queue.
   */
  track(data) {
    this.queue.push(data);

    this._checkQueueSize();

    return this;
  }

  /**
   * Clear the data stored on the cache.
   */
  clear() {
    this.queue = [];

    return this;
  }

  /**
   * Returns the payload we will use for posting data.
   */
  toJSON() {
    return this.queue;
  }

  /**
   * Check if the cache is empty.
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Check if the cache queue is full and we need to flush it.
   */
  _checkQueueSize() {
    // 0 means no maximum value, in case we want to avoid this being triggered.
    if (this.maxQueue > 0 && this.queue.length >= this.maxQueue) {
      this.onFullQueue && this.onFullQueue();
    }
  }
}

module.exports = EventsCache;
