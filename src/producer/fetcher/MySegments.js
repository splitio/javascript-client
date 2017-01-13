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

const timeout = require('../../utils/promise/timeout');

const mySegmentsService = require('../../services/mySegments');
const mySegmentsRequest = require('../../services/mySegments/get');

const mySegmentsFetcher = (settings: Object, shouldApplyTimeout: boolean = false) : Promise<MySegments> => {
  let requestPromise = mySegmentsService(mySegmentsRequest(settings));

  // Decorate with the timeout functionality if required
  if (shouldApplyTimeout) {
    requestPromise = timeout(settings.startup.requestTimeoutBeforeReady, requestPromise);
  }

  // Extract segment names
  return requestPromise
    .then(resp => resp.json())
    .then((json: Object): MySegments => json.mySegments.map(segment => segment.name));
};

module.exports = mySegmentsFetcher;
