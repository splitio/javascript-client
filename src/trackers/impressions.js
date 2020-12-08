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

import objectAssign from 'object-assign';
import logFactory from '../utils/logger';
import thenable from '../utils/promise/thenable';
import ImpressionObserverFactory from '../impressions/observer';
import { truncateTimeFrame } from '../utils/time';
import { OPTIMIZED, PRODUCER_MODE, STANDALONE_MODE } from '../utils/constants';
const log = logFactory('splitio-client:impressions-tracker');

/**
 * Checks if impressions previous time should be added or not.
 */
function shouldAddPt(settings) {
  return [PRODUCER_MODE, STANDALONE_MODE].indexOf(settings.mode) > -1 ? true : false;
}

/**
 * Checks if it should dedupe impressions or not.
 */
function shouldBeOptimized(settings) {
  if (!shouldAddPt(settings)) return false;
  return settings.sync.impressionsMode === OPTIMIZED ? true : false;
}

function ImpressionsTracker(context) {
  const collector = context.get(context.constants.STORAGE).impressions;
  const settings = context.get(context.constants.SETTINGS);
  const listener = settings.impressionListener;
  const integrationsManager = context.get(context.constants.INTEGRATIONS_MANAGER, true);
  const { ip, hostname } = settings.runtime;
  const sdkLanguageVersion = settings.version;
  const queue = [];
  const shouldAddPreviousTime = shouldAddPt(settings);
  const isOptimized = shouldBeOptimized(settings);
  const observer = ImpressionObserverFactory(); // Instantiates observer
  const impressionsCounter = context.get(context.constants.IMPRESSIONS_COUNTER);

  return {
    queue: function (impression, attributes) {
      queue.push({
        impression,
        attributes
      });
    },
    track: function () {
      const impressionsCount = queue.length;
      const slice = queue.splice(0, impressionsCount);

      const impressionsToStore = []; // Track only the impressions that are going to be stored
      // Wraps impressions to store and adds previousTime if it corresponds
      slice.forEach(({ impression }) => {
        if (shouldAddPreviousTime) {
          // Adds previous time if it is enabled
          impression.pt = observer.testAndSet(impression);
        }

        const now = Date.now();
        if (isOptimized && impressionsCounter) {
          // Increments impression counter per featureName
          impressionsCounter.inc(impression.feature, now, 1);
        }

        // Checks if the impression should be added in queue to be sent
        if (!isOptimized || !impression.pt || impression.pt < truncateTimeFrame(now)) {
          impressionsToStore.push(impression);
        }
      });

      const res = collector.track(impressionsToStore);

      // If we're on an async storage, handle error and log it.
      if (thenable(res)) {
        res.then(() => {
          log.debug(`Successfully stored ${impressionsCount} impression${impressionsCount === 1 ? '' : 's'}.`);
        }).catch(err => {
          log.error(`Could not store impressions bulk with ${impressionsCount} impression${impressionsCount === 1 ? '' : 's'}. Error: ${err}`);
        });
      }

      if (listener || integrationsManager) {
        for (let i = 0; i < impressionsCount; i++) {
          const impressionData = {
            // copy of impression, to avoid unexpected behaviour if modified by integrations or impressionListener
            impression: objectAssign({}, slice[i].impression),
            attributes: slice[i].attributes,
            ip,
            hostname,
            sdkLanguageVersion
          };

          // Wrap in a timeout because we don't want it to be blocking.
          setTimeout(function () {
            // integrationsManager.handleImpression does not throw errors
            if (integrationsManager) integrationsManager.handleImpression(impressionData);

            try { // An exception on the listeners should not break the SDK.
              if (listener) listener.logImpression(impressionData);
            } catch (err) {
              log.error(`Impression listener logImpression method threw: ${err}.`);
            }
          }, 0);
        }
      }
    }
  };
}

export default ImpressionsTracker;
