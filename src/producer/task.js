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

import logFactory from '../utils/logger';
const log = logFactory('splitio-producer:task');
import repeat from '../utils/fn/repeat';
import { getFnName } from '../utils/lang';

/**
 * Startable task factory.
 */
const TaskFactory = (updater, period) => {
  const updaterName = getFnName(updater);
  let stopUpdater = false;

  return {
    start() {
      if (!stopUpdater) {
        log.debug(`Starting ${updaterName} refreshing each ${period}`);

        stopUpdater = repeat(
          reschedule => {
            log.debug(`Running ${updaterName}`);
            updater().then(() => reschedule());
          },
          period
        );
      }
    },

    stop() {
      log.debug(`Stopping ${updaterName}`);

      stopUpdater && stopUpdater();
      stopUpdater = false;
    },

    isRunning() {
      return stopUpdater ? true : false;
    }
  };
};

export default TaskFactory;
