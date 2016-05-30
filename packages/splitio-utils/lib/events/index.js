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
var eventHandler = new EventEmitter();
var eventConstants = {
  SDK_READY: 'state::ready',
  SDK_UPDATE: 'state::update',
  SDK_UPDATE_ERROR: 'state::update-error'
};

module.exports = function () {
  var _isReady = false;
  var eventObject = (0, _create2.default)(eventHandler);

  return (0, _assign2.default)(eventObject, {
    emit: function emit(eventName) {
      for (var _len = arguments.length, listeners = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        listeners[_key - 1] = arguments[_key];
      }

      if (eventName !== eventConstants.SDK_READY && _isReady) {
        log('Event ' + eventName + ' emitted');
        eventHandler.emit.apply(eventHandler, [eventName].concat(listeners));
      } else if (eventName === eventConstants.SDK_READY) {
        log('Event ' + eventConstants.SDK_UPDATE + ' emitted');
        _isReady = true;
        eventHandler.emit.apply(eventHandler, [eventName].concat(listeners));
      }
    },
    isReady: function isReady() {
      return _isReady;
    },
    removeAllListeners: function removeAllListeners() {
      _isReady = false;
      eventHandler.removeAllListeners.apply(eventHandler, arguments);
    }
  });
}();

module.exports.events = eventConstants;