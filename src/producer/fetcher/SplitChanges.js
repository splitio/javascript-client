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
import splitChangesService from '../../services/splitChanges';
import splitChangesRequest from '../../services/splitChanges/get';

function splitChangesFetcher(settings, since, startingUp = false, metricCollectors, isNode, noCache) {
  const filterQueryString = settings.sync.__splitFiltersValidation.queryString;
  let splitsPromise = splitChangesService(splitChangesRequest(settings, since, filterQueryString, noCache));
  const collectMetrics = startingUp || isNode; // If we are on the browser, only collect this metric for first fetch. On node do it always.

  splitsPromise = tracker.start(tracker.TaskNames.SPLITS_FETCH, collectMetrics ? metricCollectors : false, splitsPromise);

  if (startingUp) { // Decorate with the timeout functionality if required
    splitsPromise = timeout(settings.startup.requestTimeoutBeforeReady, splitsPromise);
  }

  return splitsPromise
    // JSON parsing errors are handled as SplitErrors, to distinguish from user callback errors
    .then(resp => resp.json().catch(error => { throw new SplitError(error.message); }));
}

export default splitChangesFetcher;
