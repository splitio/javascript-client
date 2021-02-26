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

import timeout from '../../utils/promise/timeout';
import tracker from '../../utils/timeTracker';
import { SplitError } from '../../utils/lang/Errors';
import mySegmentsService from '../../services/mySegments';
import mySegmentsRequest from '../../services/mySegments/get';

const mySegmentsFetcher = (settings, startingUp = false, metricCollectors, noCache) => {
  let mySegmentsPromise = mySegmentsService(mySegmentsRequest(settings, noCache));

  mySegmentsPromise = tracker.start(tracker.TaskNames.MY_SEGMENTS_FETCH, startingUp ? metricCollectors : false, mySegmentsPromise);

  // Decorate with the timeout functionality if required
  if (startingUp) {
    mySegmentsPromise = timeout(settings.startup.requestTimeoutBeforeReady, mySegmentsPromise);
  }

  // Extract segment names
  return mySegmentsPromise
    // JSON parsing errors are handled as SplitErrors, to distinguish from user callback errors
    .then(resp => resp.json().catch(error => { throw new SplitError(error.message); }))
    .then(json => json.mySegments.map(segment => segment.name));
};

export default mySegmentsFetcher;
