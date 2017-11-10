import { setTimeout } from 'core-js/library/web/timers';

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

const log = require('../utils/logger')('splitio-metrics');
const tracker = require('../utils/timeTracker');

const repeat = require('../utils/fn/repeat');

const eventsService = require('../services/events');
const eventsBulkRequest = require('../services/events/bulk');

const EventsFactory = context => {
  const settings = context.get(context.constants.SETTINGS);
  const storage = context.get(context.constants.STORAGE);

  const pushEvents = () => {
    if (storage.events.isEmpty()) return Promise.resolve();

    log.info(`Pushing ${storage.events.state().length} queued events.`);
    const latencyTrackerStop = tracker.start(tracker.TaskNames.EVENTS_PUSH);

    return eventsService(eventsBulkRequest(settings, {
      body: JSON.stringify(storage.events.toJSON())
    }))
    .then(() => {
      latencyTrackerStop();
      return storage.events.clear();
    })
    .catch(() => storage.events.clear());
  };

  let stopEventsPublisher = false;
  const startEventsPublisher = () =>
    stopEventsPublisher = repeat(
      schedulePublisher => pushEvents().then(() => schedulePublisher()),
      settings.scheduler.eventsPushRate
    );

  return {
    start() {
      // On the browser there may be a wish to wait an specific amount of seconds before the first push.
      if (settings.startup.eventsFirstPushWindow > 0) {
        setTimeout(startEventsPublisher, settings.startup.eventsFirstPushWindow);
      } else {
        startEventsPublisher();
      }
    },

    flush() {
      return pushEvents();
    },

    stop() {
      stopEventsPublisher && stopEventsPublisher();
    }
  };
};

module.exports = EventsFactory;
