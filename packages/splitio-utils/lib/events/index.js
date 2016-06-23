'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
var log = require('debug')('splitio-utils:events');

var EventEmitter = require('events').EventEmitter;
var Event = {
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
  var proto = new EventEmitter();
  var hub = (0, _create2.default)(proto);

  var isReady = false;
  var isReadyEventEmitted = false;
  var areSplitsReady = false;
  var areSegmentsReady = false;

  return (0, _assign2.default)(hub, {
    emit: function emit(eventName) {
      throwOnInvalidEvent(eventName);

      var isDataUpdateEvent = eventName === Event.SDK_SPLITS_ARRIVED || eventName === Event.SDK_SEGMENTS_ARRIVED;

      if (!areSplitsReady && eventName === Event.SDK_SPLITS_ARRIVED) {
        log('splits are ready');

        areSplitsReady = true;
        isReady = areSplitsReady && areSegmentsReady;
      }

      if (!areSegmentsReady && eventName === Event.SDK_SEGMENTS_ARRIVED) {
        log('segments are ready');

        areSegmentsReady = true;
        isReady = areSplitsReady && areSegmentsReady;
      }

      for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
      }

      if (eventName === Event.SDK_READY_TIMED_OUT) {
        if (!isReadyEventEmitted) {
          log('Emitting event ' + Event.SDK_READY_TIMED_OUT);

          return proto.emit.apply(proto, [eventName].concat(rest));
        } else {
          return false;
        }
      }

      if (!isReadyEventEmitted && isReady && isDataUpdateEvent) {
        log('Emitting event ' + Event.SDK_READY);

        isReadyEventEmitted = true;
        return proto.emit.apply(proto, [Event.SDK_READY].concat(rest));
      }

      if (isReady && isDataUpdateEvent) {
        log('Emitting event ' + Event.SDK_UPDATE);

        return proto.emit.apply(proto, [Event.SDK_UPDATE].concat(rest));
      }

      if (!isDataUpdateEvent) {
        log('Emitting custom event ' + eventName);

        return proto.emit.apply(proto, [eventName].concat(rest));
      }

      return false;
    },

    Event: Event
  });
};
module.exports.Event = Event;