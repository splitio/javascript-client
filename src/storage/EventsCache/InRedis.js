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
import logFactory from '../../utils/logger';
const log = logFactory('splitio-storage:redis');

class EventsCache {
  constructor(keys, redis, meta) {
    this.keys = keys;
    this.redis = redis;
    this.meta = meta;

    this.eventsKey = keys.buildEventsKey();
  }

  /**
   * Add a new event object into the queue.
   */
  track(eventData) {
    return this.redis.rpush(
      this.eventsKey,
      this._toJSON(eventData)
    )
      // We use boolean values to signal successful queueing
      .then(() => true)
      .catch(err => {
        log.error(`Error adding event to queue: ${err}.`);
        return false;
      });
  }

  /**
   * Generates the JSON as we'll store it on Redis.
   */
  _toJSON(eventData) {
    return JSON.stringify({
      m: this.meta,
      e: eventData
    });
  }

  /**
   * We are returning true because the go syncronizer push the impressions from redis.
   */
  isEmpty() {
    return true;
  }
}

export default EventsCache;
