'use strict';

//
// Bellow you will see how you could define features and the defaults treatments
// for each one.
//
// NOTICE: there is NONE asyncronous initialization in offline mode, because you
//         are providing the default feedback of the engine.
//
var sdk = splitio({
  core: {
    // change this with your api token
    authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib',
    // change this with your user key
    key: '1f84e5ddb06a3e66145ccfc1aac247'
  },
  scheduler: {
    // fetch feature updates each 15 sec
    featuresRefreshRate: 15,
    // fetch segment updates each 15 sec
    segmentsRefreshRate: 15,
    // publish metrics each 15 sec
    metricsRefreshRate: 15,
    // publish evaluations each 15 sec
    impressionsRefreshRate: 15
  },
  urls: {
    sdk: 'https://sdk-aws-staging.split.io/api',
    events: 'https://events-aws-staging.split.io/api'
  }
});

console.assert(
  sdk.getTreatment('in_five_keys') === 'control'
);

sdk.on(sdk.Event.SDK_READY_TIMED_OUT, function onTimeout() {
  console.log('SDK ready timeout');
});

sdk.on(sdk.Event.SDK_READY, function onSDKReady() {
  console.assert(sdk.getTreatment('in_five_keys') === 'activated');
});

sdk.on(sdk.Event.SDK_UPDATE, function onSDKUpdate() {
  console.log(sdk.getTreatment('in_five_keys'));
  console.log(sdk.getTreatment('in_ten_keys'));
});

// just to show up the deprecated message
sdk.ready().then(function () {});
