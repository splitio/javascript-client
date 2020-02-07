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
const log = logFactory('splitio-client:impression-tracker');

function ImpressionsTrackerContext(context) {
  const collector = context.get(context.constants.STORAGE).impressions;
  const settings = context.get(context.constants.SETTINGS);
  const listener = settings.impressionListener;
  const internalListener = context.get(context.constants.INTERNAL_IMPRESSION_LISTENER, true);
  const { ip, hostname } = settings.runtime;
  const sdkLanguageVersion = settings.version;

  return {
    track: function (impression, attributes) {
      const res = collector.track([impression]);

      // If we're on an async storage, handle error and log it.
      if (thenable(res)) res.catch(err => {
        log.error(`Could not store impression. Error: ${err}`);
      });

      if (listener || internalListener) {
        const impressionData = {
          impression,
          attributes,
          ip,
          hostname,
          sdkLanguageVersion
        };
        // Wrap in a timeout because we don't want it to be blocking.
        setTimeout(() => {
          try { // An exception on the listener should not break the SDK.
            // InternalListener (used for split2ga integration) does not throw errors, thus we put it first
            if (internalListener) internalListener.logImpression(impressionData);
            if (listener) listener.logImpression(impressionData);
          } catch (err) {
            log.error(`Impression listener logImpression method threw: ${err}.`);
          }
        }, 0);
      }
    }
  };
}

export default ImpressionsTrackerContext;
