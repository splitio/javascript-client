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
// @flow

'use strict';

const log = require('debug')('splitio-utils:events');

const EventEmitter = require('events').EventEmitter;
const Event = {
  SDK_READY_TIMED_OUT: 'init::timeout',
  SDK_READY: 'init::ready',
  SDK_SPLITS_ARRIVED: 'state::splits-arrived',
  SDK_SEGMENTS_ARRIVED: 'state::segments-arrived',
  SDK_UPDATE: 'state::update',
  SDK_UPDATE_ERROR: 'state::update-error'
};

function throwOnInvalidEvent(eventName) {
  switch (eventName) {
    case Event.SDK_READY:
    case Event.SDK_UPDATE:
      throw new Error('Reserved event name.');
  }
}

module.exports = function EventFactory() {
  const proto = new EventEmitter();
  const hub = Object.create(proto);

  let isReady = false;
  let isReadyEventEmitted = false;
  let areSplitsReady = false;
  let areSegmentsReady = false;

  return Object.assign(hub, {
    emit(eventName, ...rest) {
      throwOnInvalidEvent(eventName);

      const isDataUpdateEvent = eventName === Event.SDK_SPLITS_ARRIVED ||
                                eventName === Event.SDK_SEGMENTS_ARRIVED;

      if (!areSplitsReady && eventName === Event.SDK_SPLITS_ARRIVED) {
        log('Splits are ready');

        areSplitsReady = true;
        isReady = areSplitsReady && areSegmentsReady;
      }

      if (!areSegmentsReady && eventName === Event.SDK_SEGMENTS_ARRIVED) {
        log('Segments are ready');

        areSegmentsReady = true;
        isReady = areSplitsReady && areSegmentsReady;
      }

      if (eventName === Event.SDK_READY_TIMED_OUT) {
        if (!isReadyEventEmitted) {
          log(`Emitting event ${Event.SDK_READY_TIMED_OUT}`);

          return proto.emit(eventName, ...rest);
        } else {
          return false;
        }
      }

      if (!isReadyEventEmitted && isReady && isDataUpdateEvent) {
        log(`Emitting event ${Event.SDK_READY}`);

        isReadyEventEmitted = true;
        return proto.emit(Event.SDK_READY, ...rest);
      }

      if (isReady && isDataUpdateEvent) {
        log(`Emitting event ${Event.SDK_UPDATE}`);

        return proto.emit(Event.SDK_UPDATE, ...rest);
      }

      if (!isDataUpdateEvent) {
        log(`Emitting custom event ${eventName}`);

        return proto.emit(eventName, ...rest);
      }

      return false;
    },
    ...Event
  });
};
module.exports.Event = Event;
