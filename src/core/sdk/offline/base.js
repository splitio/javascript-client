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
const warning = require('warning');
const log = require('debug')('splitio:offline');

const EventsFactory = require('../../../utils/events');
const Event = EventsFactory.Event;

const validIdentifier = /^[a-z][-_a-z0-9]*$/i;
function isIdentifierInvalid(str) {
  return !validIdentifier.test(str);
}

function offlineFactory(settings) {
  const hub = EventsFactory();

  let { features } = Object.assign({
    features: {}
  }, settings);

  log('Running Split in Off-the-grid mode!!!!');

  for (let [name, treatment] of Object.entries(features)) {
    if (isIdentifierInvalid(name)) {
      log(
`>
>> Invalid feature name "${name}"
>>>> Please check you are using ${validIdentifier}
>
`
      );
      delete features[name];
    }

    if (isIdentifierInvalid(treatment)) {
      log(
`>
>> Invalid treatment "${treatment}" in feature "${name}"
>> Please check you are using ${validIdentifier} ('control' is a reserved word)
>`
      );
      delete features[name];
    }
  }

  // simulates data has been arrived asyncronously
  setTimeout(function simulateDataArrived() {
    hub.emit(Event.SDK_SPLITS_ARRIVED);
    hub.emit(Event.SDK_SEGMENTS_ARRIVED);
  }, 10);

  const readyPromise = new Promise(function onReady(resolve) {
    hub.on(hub.Event.SDK_READY, resolve);
  });

  return Object.assign(hub, {
    getTreatment(key, featureName) {
      // always the latest parameter is the feature name.
      let treatment = features[featureName];

      return typeof treatment !== 'string' ? 'control' : treatment;
    },
    ready() {
      warning(false, '`.ready()` is deprecated. Please use `sdk.on(sdk.Event.SDK_READY, callback)`');
      return readyPromise;
    },
    destroy() {
      hub.removeAllListeners();
    }
  });
}

module.exports = offlineFactory;
