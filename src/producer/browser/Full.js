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

import logFactory from '../../utils/logger';
const log = logFactory('splitio-producer:updater');
import TaskFactory from '../task';
import SplitChangesUpdater from '../updater/SplitChanges';
import MySegmentsUpdater from '../updater/MySegments';

/**
 * Startup all the background jobs required for a Browser SDK instance.
 */
const FullBrowserProducer = (context) => {
  const splitsUpdater = SplitChangesUpdater(context);
  
  const segmentsUpdater = MySegmentsUpdater(context);
  const settings = context.get(context.constants.SETTINGS);
  const {
    splits: splitsEventEmitter,
    segments: segmentsEventEmitter
  } = context.get(context.constants.READINESS);
  const splitsStorage = context.get(context.constants.STORAGE).splits;
  
  const splitsUpdaterTask = TaskFactory(splitsUpdater, settings.scheduler.featuresRefreshRate);
  const segmentsUpdaterTask = TaskFactory(segmentsUpdater, settings.scheduler.segmentsRefreshRate);
  
  let syncingSegments = true;
  
  splitsEventEmitter.on(splitsEventEmitter.SDK_SPLITS_ARRIVED, function() {
    const splitsHaveSegments = splitsStorage.usesSegments();

    if (splitsHaveSegments !== syncingSegments) {
      syncingSegments = splitsHaveSegments;
      log.info(`Turning segments data polling ${splitsHaveSegments ? 'ON' : 'OFF'}.`);

      if (splitsHaveSegments) {
        segmentsUpdaterTask.start();
      } else {
        const isReady = context.get(context.constants.READY, true);

        if (!isReady) segmentsEventEmitter.emit(segmentsEventEmitter.SDK_SEGMENTS_ARRIVED);
        segmentsUpdaterTask.stop();
      }
    }
  });

  return {
    start() {
      log.info('Starting BROWSER producer');

      splitsUpdaterTask.start();
      segmentsUpdaterTask.start();
    },

    stop() {
      log.info('Stopping BROWSER producer');

      splitsUpdaterTask.stop();
      segmentsUpdaterTask && segmentsUpdaterTask.stop();
    }
  };
};

export default FullBrowserProducer;