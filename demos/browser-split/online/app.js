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
    authorizationKey: 'rmnfoseojca9s4hhl93qavv1dvj61jor7ko6',
    key: '84e8f1f0-d5d4-11e5-a7e9-742f68b6be99'
    // authorizationKey: '9tnua8udt2ap4i20sls8aa37k7fgi9sg13ec',
    // key: '31d0b4b0-cf9b-11e5-bd73-563bf9b5392b'
  },
  scheduler: {
    // featuresRefreshRate: 30000, // miliseconds
    // segmentsRefreshRate: 40000, // miliseconds
    // metricsRefreshRate: 300000  // miliseconds (randomly choosen based on this initial rate).
  }
});

sdk.ready(function () {
  console.info( sdk.getTreatment('js_sdk') );
  // console.info( sdk.getTreatment('payment_system') );
  // console.info( sdk.getTreatment('airline_company') );
  // console.info( sdk.getTreatment('unknown_feature') );
  console.info( sdk.getTreatment('early_evaluation') );
});
