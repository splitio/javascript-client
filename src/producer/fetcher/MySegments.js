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

const timeout = require('../../utils/promise/timeout');
const tracker = require('../../utils/timeTracker');

const mySegmentsService = require('../../services/mySegments');
const mySegmentsRequest = require('../../services/mySegments/get');

let firstFetch = true;

const mySegmentsFetcher = (settings, shouldApplyTimeout = false, metricCollectors) => {
  let mySegmentsPromise = mySegmentsService(mySegmentsRequest(settings));

  if (firstFetch) {
    tracker.start(tracker.TaskNames.MY_SEGMENTS_FETCH, metricCollectors, mySegmentsPromise);
    firstFetch = false;
  }

  // Decorate with the timeout functionality if required
  if (shouldApplyTimeout) {
    mySegmentsPromise = timeout(settings.startup.requestTimeoutBeforeReady, mySegmentsPromise);
  }

  // Extract segment names
  return mySegmentsPromise
    .then(resp => resp.json())
    .then(json => json.mySegments.map(segment => segment.name));
};

module.exports = mySegmentsFetcher;
