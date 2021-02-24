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

import segmentChangesService from '../../services/segmentChanges';
import segmentChangesRequest from '../../services/segmentChanges/get';
import tracker from '../../utils/timeTracker';

function greedyFetch(settings, lastSinceValue, segmentName, metricCollectors, noCache) {
  return tracker.start(tracker.TaskNames.SEGMENTS_FETCH, metricCollectors, segmentChangesService(segmentChangesRequest(settings, {
    since: lastSinceValue,
    segmentName
  }, noCache)))
    // no need to handle json parsing errors as SplitError, since errors are handled differently for segments
    .then(resp => resp.json())
    .then(json => {
      let { since, till } = json;
      if (since === till) {
        return [json];
      } else {
        return Promise.all([json, greedyFetch(settings, till, segmentName, undefined, noCache)]).then(flatMe => {
          return [flatMe[0], ...flatMe[1]];
        });
      }
    })
    .catch(err => {
      // If the operation is forbidden it may be due to permissions, don't recover and propagate the error.
      if (err.statusCode === 403) throw err;
      // if something goes wrong with the request to the server, we are going to
      // stop requesting information till the next round of downloading
      return [];
    });
}

// @TODO migrate to a generator function and do the job incrementally
function segmentChangesFetcher(settings, segmentName, since, metricCollectors, noCache) {
  return greedyFetch(settings, since, segmentName, metricCollectors, noCache);
}

export default segmentChangesFetcher;
