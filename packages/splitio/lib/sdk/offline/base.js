'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _entries = require('babel-runtime/core-js/object/entries');

var _entries2 = _interopRequireDefault(_entries);

var _getIterator2 = require('babel-runtime/core-js/get-iterator');

var _getIterator3 = _interopRequireDefault(_getIterator2);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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
var warning = require('warning');
var log = require('debug')('splitio:offline');

var EventsFactory = require('@splitsoftware/splitio-utils/lib/events');
var Event = EventsFactory.Event;

var validIdentifier = /^[a-z][-_a-z0-9]*$/i;
function isIdentifierInvalid(str) {
  return !validIdentifier.test(str);
}

function offlineFactory(settings) {
  var hub = EventsFactory();

  var _Object$assign = (0, _assign2.default)({
    features: {}
  }, settings);

  var features = _Object$assign.features;


  log('Running Split in Off-the-grid mode!!!!');

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator3.default)((0, _entries2.default)(features)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var _step$value = (0, _slicedToArray3.default)(_step.value, 2);

      var name = _step$value[0];
      var treatment = _step$value[1];

      if (isIdentifierInvalid(name)) {
        log('>\n>> Invalid feature name "' + name + '"\n>>>> Please check you are using ' + validIdentifier + '\n>\n');
        delete features[name];
      }

      if (isIdentifierInvalid(treatment)) {
        log('>\n>> Invalid treatment "' + treatment + '" in feature "' + name + '"\n>> Please check you are using ' + validIdentifier + ' (\'control\' is a reserved word)\n>');
        delete features[name];
      }
    }

    // simulates data has been arrived asyncronously
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  setTimeout(function simulateDataArrived() {
    hub.emit(Event.SDK_SPLITS_ARRIVED);
    hub.emit(Event.SDK_SEGMENTS_ARRIVED);
  }, 10);

  var readyPromise = new _promise2.default(function onReady(resolve) {
    hub.on(hub.Event.SDK_READY, resolve);
  });

  return (0, _assign2.default)(hub, {
    getTreatment: function getTreatment(key, featureName) {
      // always the latest parameter is the feature name.
      var treatment = features[featureName];

      return typeof treatment !== 'string' ? 'control' : treatment;
    },
    ready: function ready() {
      warning(true, '`.ready()` is deprecated. Please use `sdk.on(sdk.Event.SDK_READY, callback)`');
      return readyPromise;
    },
    destroy: function destroy() {
      hub.removeAllListeners();
    }
  });
}

module.exports = offlineFactory;