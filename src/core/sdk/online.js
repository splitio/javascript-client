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

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

/*::
  type KeyDTO = {
    matchingKey: string,
    bucketingKey: string
  }
*/

const warning = require('warning');
const log = require('debug')('splitio');

const SettingsFactory = require('../../utils/settings');
const EventsFactory = require('../../utils/events');
const Metrics = require('../../metrics');
const Cache = require('../../cache');
const { matching, bucketing } = require('../../utils/key/factory');
const LabelsConstants = require('../../utils/labels');

function onlineFactory(params /*: object */) /*: object */ {
  const settings = SettingsFactory(params);
  const hub = EventsFactory();
  const metrics = new Metrics(settings);
  const impressionsTracker = metrics.impressions;
  const getTreatmentTracker = metrics.getTreatment;
  const cache = new Cache(settings, hub);

  log(settings);

  cache.start();
  metrics.start();

  // start the race vs the SDK startup!
  if (settings.startup.readyTimeout > 0) {
    setTimeout(() => {
      hub.emit(hub.Event.SDK_READY_TIMED_OUT);
    }, settings.startup.readyTimeout);
  }

  const readyPromise = new Promise(function onReady(resolve) {
    hub.on(hub.Event.SDK_READY, resolve);
  });

  return Object.assign(hub, {
    getTreatment(key /*: string | KeyDTO */, featureName /*: string */, attributes /*: object */) /*: string */ {
      let evaluation = {
        treatment: 'control',
        label: LabelsConstants.SPLIT_NOT_FOUND
      };

      let stopGetTreatmentTracker = getTreatmentTracker(); // start engine perf monitoring

      let split = cache.storage.splits.get(featureName);
      if (split) {
        evaluation = split.getTreatment(key, attributes);

        log(`feature ${featureName} key ${matching(key)} evaluated as ${evaluation.treatment}`);
      } else {
        log(`feature ${featureName} doesn't exist`);
      }

      stopGetTreatmentTracker(); // finish engine perf monitoring

      impressionsTracker({
        feature: featureName,
        key: matching(key),
        treatment: evaluation.treatment,
        when: Date.now(),
        bucketingKey: bucketing(key),
        label: settings.core.labelsEnabled ? evaluation.label : null
      });

      return evaluation.treatment;
    },

    ready() {
      warning(false, '`.ready()` is deprecated. Please use `sdk.on(sdk.Event.SDK_READY, callback)`');
      return readyPromise;
    },

    destroy() {
      log('destroying sdk instance');

      hub.removeAllListeners();
      metrics.stop();
      cache.stop();
    }
  });
}

module.exports = onlineFactory;
