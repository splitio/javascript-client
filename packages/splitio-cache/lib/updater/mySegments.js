'use strict';

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
var log = require('debug')('splitio-cache:updater');
var mySegmentsDataSource = require('../ds/mySegments');

function MySegmentsUpdater(settings, hub, storage) {
  // only enable retries first load
  var startingUp = true;

  return function updateMySegments() {
    var retry = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

    return mySegmentsDataSource(settings, startingUp).then(function (segmentsMutator) {
      return segmentsMutator(storage);
    }).then(function (shouldUpdate) {
      if (startingUp) {
        startingUp = false;
      }

      if (shouldUpdate) {
        hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
      }

      return shouldUpdate;
    }).catch(function (error) {
      if (startingUp && settings.startup.retriesOnFailureBeforeReady > retry) {
        retry += 1;
        log('retrying download of segments #%s reason %s', retry, error);
        return updateMySegments(retry);
      } else {
        startingUp = false;
      }

      return false; // shouldUpdate = false
    });
  };
}

module.exports = MySegmentsUpdater;