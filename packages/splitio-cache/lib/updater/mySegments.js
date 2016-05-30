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
var eventHandlers = require('@splitsoftware/splitio-utils/lib/events');
var events = eventHandlers.events;

module.exports = function mySegmentsUpdater(storage) {
  return function updateMySegments() {
    log('Updating mySegments');

    return mySegmentsDataSource().then(function (segmentsMutator) {
      return segmentsMutator(storage);
    }).then(function () {
      return eventHandlers.emit(events.SDK_UPDATE, storage);
    }).catch(function (error) {
      return eventHandlers.emit(events.SDK_UPDATE_ERROR, error);
    });
  };
};