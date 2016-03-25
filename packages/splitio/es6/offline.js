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

const help = `
Looks you are not providing a valid set of settings! Let me show you a little snippet:

var localhost = {
    features: {
        my_cool_feature_name: 'version_a',
        another_feature_name: 'version_b',
        ...
    }
};

var sdk = splitio(localhost);

sdk.getTreatment('my_cool_feature_name') === 'version_a'; // This is true!
sdk.getTreatment('another_feature_name') === 'version_b'; // This is true!
sdk.getTreatment('missing_feature_name') === 'control';   // This is true!

Let's start hacking!
`;

const featuresAttributeMustBeAnObject = `
Hey! Please recheck features attribute, it should be an object with the
following shape:

var localhost = {
  ===> features: {
  ===>     my_cool_feature_name: 'version_a',
  ===>     another_feature_name: 'version_b',
  ===>     ...
  ===> }
};

REMEMBER: any feature not present in this object will be evaluated as 'control'
`;

const validIdentifier = /^[a-z][-_a-z0-9]*$/i;
function isIdentifierInvalid(str) {
  return !validIdentifier.test(str);
}

function splitio(localhost) {
  let typeOfLocalhost = typeof localhost;
  let typeOfFeatures = typeOfLocalhost === 'undefined'
    ? 'undefined' :
    typeof localhost.features;

  let { features } = Object.assign({
    features: {}
  }, localhost);

  if (typeOfLocalhost === 'undefined' || typeOfFeatures === 'undefined') {
    console.info(help);
  } else if (Object.prototype.toString.call(features) !== '[object Object]') {
    console.info(featuresAttributeMustBeAnObject);
    features = {};
  }

  for (let [name, treatment] of Object.entries(features)) {
    if (isIdentifierInvalid(name)) {
      console.error(
`>
>> Invalid feature name "${name}"
>>>> Please check using ${validIdentifier}
>
`
      );
      delete features[name];
    }

    if (isIdentifierInvalid(treatment)) {
      console.error(
`>
>> Invalid treatment "${treatment}" in feature "${name}"
>> Please check using ${validIdentifier} and 'control' is a reserved word
>`
      );
      delete features[name];
    }
  }

  let alwaysReadyPromise = Promise.resolve(undefined);

  return {
    getTreatment(...params) {
      if (params.length > 2 || params.length === 0) {
        console.error('Please verify the parameters, you could use getTreatment(featureName) or getTreatment(key, featureName)');

        return 'control';
      }

      // always the latest parameter is the feature name.
      let featureName = params[params.length - 1];
      let treatment = features[featureName];

      return typeof treatment === 'undefined' ?
          'control' :
          treatment;
    },
    ready() {
      return alwaysReadyPromise;
    }
  };
}

global.splitio = module.exports = splitio;
