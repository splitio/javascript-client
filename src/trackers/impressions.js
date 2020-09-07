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
import ImpressionObserver from '../impressions/observer';
const log = logFactory('splitio-client:impressions-tracker');

const LAST_SEEN_CACHE_SIZE = 500000; // cache up to 500k impression hashes

function ImpressionsTracker(context) {
  const collector = context.get(context.constants.STORAGE).impressions;
  const settings = context.get(context.constants.SETTINGS);
  const listener = settings.impressionListener;
  const impressionObserver = new ImpressionObserver(LAST_SEEN_CACHE_SIZE);
  const integrationsManager = context.get(context.constants.INTEGRATIONS_MANAGER, true);
  const { ip, hostname } = settings.runtime;
  const sdkLanguageVersion = settings.version;
  const queue = [];

  return {
    queue: function (impression, attributes) {
      impression.pt = impressionObserver.testAndSet(impression);
      queue.push({
        impression,
        attributes
      });
    },
    track: function () {
      const impressionsCount = queue.length;
      const slice = queue.splice(0, impressionsCount);
      const res = collector.track(slice.map(({ impression }) => impression));

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
