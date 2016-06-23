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
var timeout = require('@splitsoftware/splitio-utils/lib/promise/timeout');

var splitChangesService = require('@splitsoftware/splitio-services/lib/splitChanges');
var splitChangesRequest = require('@splitsoftware/splitio-services/lib/splitChanges/get');

var splitMutatorFactory = require('../mutators/splitChanges');

function splitChangesDataSource(settings, sinceValueCache) {
  var shouldApplyTimeout = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

  var requestPromise = splitChangesService(splitChangesRequest(settings, sinceValueCache));

  if (shouldApplyTimeout) {
    requestPromise = timeout(settings.startup.requestTimeoutBeforeReady, requestPromise);
  }

  return requestPromise.then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var till = json.till;
    var splits = json.splits;

    var shouldUpdate = sinceValueCache.since !== till;

    sinceValueCache.since = till;

    return splitMutatorFactory(shouldUpdate, splits);
  });
}

module.exports = splitChangesDataSource;