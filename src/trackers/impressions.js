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
import thenable from '../utils/promise/thenable';
const log = logFactory('splitio-client:impressions-tracker');

function ImpressionsTrackerContext(context) {
  const collector = context.get(context.constants.STORAGE).impressions;
  const settings = context.get(context.constants.SETTINGS);
  const listener = settings.impressionListener;
  const { ip, hostname } = settings.runtime;
  const sdkLanguageVersion = settings.version;
  const queue = [];

  return {
    queue: function(impression, attributes) {
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
      // Wrap in a timeout because we don't want it to be blocking.
      for (let i = 0; i < impressionsCount; i++) {
        listener && setTimeout(() => {
          try { // An exception on the listener should not break the SDK.
            listener.logImpression({
              impression: slice[i].impression,
              attributes: slice[i].attributes,
              ip,
              hostname,
              sdkLanguageVersion
            });
          } catch (err) {
            log.error(`Impression listener logImpression method threw: ${err}.`);
          }
        }, 0);
      }
    }
  };
}

export default ImpressionsTrackerContext;
