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
const log = require('debug')('splitio-utils:events');

const EventEmitter = require('events').EventEmitter;
const Event = {
  SDK_READY: 'state::ready',
  SDK_UPDATE: 'state::update',
  SDK_UPDATE_ERROR: 'state::update-error'
};

module.exports = function EventFactory() {
  const proto = new EventEmitter();
  const hub = Object.create(proto);
  let _isReady = false;

  return Object.assign(hub, {
    emit(eventName, ...listeners) {
      // simulating once event just for simplicity
      if (eventName === Event.SDK_READY) {
        if (!_isReady) {
          log(`Emitting event ${Event.SDK_READY}`);
          _isReady = true;
          return proto.emit(eventName, ...listeners);
        } else {
          log(`Discarding event ${Event.SDK_READY}`);
          return false;
        }
      }

      // updates should be fired only after ready state
      if (eventName === Event.SDK_UPDATE) {
        if (_isReady) {
          log(`Emitting event ${eventName}`);
          return proto.emit(eventName, ...listeners);
        } else {
          log(`Discarding event ${Event.SDK_UPDATE}`);
          return false;
        }
      }

      // for future events just fire them
      return proto.emit(eventName, ...listeners);
    },
    Event
  });
};
module.exports.Event = Event;
