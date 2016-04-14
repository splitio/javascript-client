'use strict';

console.log('SPLIT DEMO!');

//
// Bellow you will see how you could define features and the defaults treatments
// for each one.
//
// NOTICE: there is NONE asyncronous initialization in offline mode, because you
//         are providing the default feedback of the engine.
//

var sdk = splitio({
  core: {
    authorizationKey: '29lsbc79peklpksdto0a90s2e3u1agv8vqm2', // change this with your api token
    key: '4a2c4490-ced1-11e5-9b97-d8a25e8b1578'               // change this with your user key
  }/*,
  scheduler: {
    featuresRefreshRate: 1,    // fetch feature updates each 1 sec
    segmentsRefreshRate: 1,    // fetch segment updates each 1 sec
    metricsRefreshRate: 30,    // publish metrics each 30 sec
    impressionsRefreshRate: 30 // publish evaluations each 30 sec
  }*/
});

console.info( sdk.getTreatment('early_evaluation') , '<= We are asking for a feature before the engine is ready');

sdk.ready().then(function () {
  console.info( sdk.getTreatment('js_sdk'), '<= This answer depends on split configurations' );
});
