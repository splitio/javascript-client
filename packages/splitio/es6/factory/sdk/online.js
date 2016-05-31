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

// I'll need to fix first 'isomorphic-fetch' to be transpiled using
// babel-runtime before remove this line of code.
require('core-js/es6/promise');

const log = require('debug')('splitio');

const SettingsFactory = require('@splitsoftware/splitio-utils/lib/settings');

const EventsFactory = require('@splitsoftware/splitio-utils/lib/events');
const Event = EventsFactory.Event;

const MetricsFactory = require('@splitsoftware/splitio-metrics');

const core = require('../../scheduler');

function onlineFactory(params /*: object */) /*: object */ {
  const settings = SettingsFactory(params);
  const metrics = MetricsFactory(settings);
  const impressionsTracker = metrics.impressions;
  const getTreatmentTracker = metrics.getTreatment;
  const hub = EventsFactory();
  let engine;
  let engineReadyPromise;

  // the engine startup is async (till we get localStorage as
  // secondary cache)
  engineReadyPromise = core(settings, hub).then(function (state) {
    engine = state;
  }).catch(function () {});

  // startup monitoring tools
  metrics.start(settings);

  return Object.assign(hub, {
    getTreatment(key /*: string */, featureName /*: string */, attributes /*: object */) /*: string */ {
      let treatment = 'control';

      if (engine === undefined) {
        impressionsTracker({
          feature: featureName,
          key,
          treatment,
          when: Date.now()
        });

        return treatment;
      }

      let stopGetTreatmentTracker = getTreatmentTracker(); // start engine perf monitoring

      let split = engine.splits.get(featureName);
      if (split) {
        treatment = split.getTreatment(key, attributes);

        log(`feature ${featureName} key ${key} evaluated as ${treatment}`);
      } else {
        log(`feature ${featureName} doesn't exist`);
      }

      stopGetTreatmentTracker(); // finish engine perf monitoring

      impressionsTracker({
        feature: featureName,
        key,
        treatment,
        when: Date.now()
      });

      return treatment;
    },

    ready() /*: Promise */ {
      return engineReadyPromise.then(() => this.emit(Event.SDK_READY, engine));
    }
  });
}

module.exports = onlineFactory;
