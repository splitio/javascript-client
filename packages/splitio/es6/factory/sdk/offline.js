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

/*eslint-disable no-console */

const validIdentifier = /^[a-z][-_a-z0-9]*$/i;
function isIdentifierInvalid(str) {
  return !validIdentifier.test(str);
}

function offlineFactory(settings) {
  let { features } = Object.assign({
    features: {}
  }, settings);

  console.warn('Running Split in Off-the-grid mode!!!!');

  for (let [name, treatment] of Object.entries(features)) {
    if (isIdentifierInvalid(name)) {
      console.warn(
`>
>> Invalid feature name "${name}"
>>>> Please check you are using ${validIdentifier}
>
`
      );
      delete features[name];
    }

    if (isIdentifierInvalid(treatment)) {
      console.warn(
`>
>> Invalid treatment "${treatment}" in feature "${name}"
>> Please check you are using ${validIdentifier} ('control' is a reserved word)
>`
      );
      delete features[name];
    }
  }

  let alwaysReadyPromise = Promise.resolve(undefined);

  return {
    getTreatment(key, featureName) {
      // always the latest parameter is the feature name.
      let treatment = features[featureName];

      return typeof treatment !== 'string' ? 'control' : treatment;
    },
    ready() {
      return alwaysReadyPromise;
    }
  };
}

module.exports = offlineFactory;
