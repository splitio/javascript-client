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
    // fetch feature updates each 1 sec
    featuresRefreshRate: 3,
    // fetch segment updates each 1 sec
    segmentsRefreshRate: 5,
    // publish metrics each 30 sec
    metricsRefreshRate: 30,
    // publish evaluations each 30 sec
    impressionsRefreshRate: 30
  },
  urls: {
    // crazy cdn
    // sdk: 'http://localhost:3000/api'
    sdk: 'https://sdk-aws-staging.split.io/api'
  },
  startup: {
    // stress the request time used while starting up the SDK.
    requestTimeoutBeforeReady: 1,
    // how many quick retries we will do while starting up the SDK.
    retriesOnFailureBeforeReady: 2,
    // maximun amount of time used before notifies me a timeout.
    readyTimeout: 1.5
  }
});

console.assert(
  sdk.getTreatment('in_five_keys') === 'control'
);

sdk.on(sdk.Event.SDK_READY_TIMED_OUT, function onTimeout() {
  console.log('SDK ready timeout 😭');
});

sdk.on(sdk.Event.SDK_READY, function onSDKReady() {
  console.assert(
    sdk.getTreatment('in_five_keys') === 'activated'
  );
});

sdk.on(sdk.Event.SDK_UPDATE, function onSDKUpdate() {
  console.log(sdk.getTreatment('in_five_keys'));
  console.log(sdk.getTreatment('in_ten_keys'));
});
