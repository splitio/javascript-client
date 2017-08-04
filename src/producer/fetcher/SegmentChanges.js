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

const segmentChangesService = require('../../services/segmentChanges');
const segmentChangesRequest = require('../../services/segmentChanges/get');

const tracker = require('../../utils/timeTracker');

function greedyFetch(settings, lastSinceValue, segmentName, metricCollectors) {
  return tracker.start(tracker.TaskNames.SEGMENTS_FETCH, metricCollectors, segmentChangesService(segmentChangesRequest(settings, {
    since: lastSinceValue,
    segmentName
  })))
  .then(resp => resp.json())
  .then(json => {
    let {since, till} = json;
    if (since === till) {
      return [json];
    } else {
      return Promise.all([json, greedyFetch(settings, till, segmentName)]).then(flatMe => {
        return [flatMe[0], ...flatMe[1]];
      });
    }
  })
  .catch(function () {
    // if something goes wrong with the request to the server, we are going to
    // stop requesting information till the next round of downloading
    return [];
  });
}

// @TODO migrate to a generator function and do the job incrementally
function segmentChangesFetcher(settings, segmentName, since, metricCollectors) {
  return greedyFetch(settings, since, segmentName, metricCollectors);
}

module.exports = segmentChangesFetcher;
module.exports.greedyFetch = greedyFetch;
