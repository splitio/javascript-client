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
  SDK_READY: 'state::ready',
  SDK_UPDATE: 'state::update',
  SDK_UPDATE_ERROR: 'state::update-error'
};

module.exports = function EventFactory() {
  var proto = new EventEmitter();
  var hub = (0, _create2.default)(proto);
  var _isReady = false;

  return (0, _assign2.default)(hub, {
    emit: function emit(eventName) {
      for (var _len = arguments.length, listeners = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        listeners[_key - 1] = arguments[_key];
      }

      // simulating once event just for simplicity
      if (eventName === Event.SDK_READY) {
        if (!_isReady) {
          log('Emitting event ' + Event.SDK_READY);
          _isReady = true;
          return proto.emit.apply(proto, [eventName].concat(listeners));
        } else {
          log('Discarding event ' + Event.SDK_READY);
          return false;
        }
      }

      // updates should be fired only after ready state
      if (eventName === Event.SDK_UPDATE) {
        if (_isReady) {
          log('Emitting event ' + eventName);
          return proto.emit.apply(proto, [eventName].concat(listeners));
        } else {
          log('Discarding event ' + Event.SDK_UPDATE);
          return false;
        }
      }

      // for future events just fire them
      return proto.emit.apply(proto, [eventName].concat(listeners));
    },

    Event: Event
  });
};
module.exports.Event = Event;