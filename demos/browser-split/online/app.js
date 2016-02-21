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
    authorizationKey: 'c1l5vkd50gimccout3c03pntbu',
    key: '4a2c4490-ced1-11e5-9b97-d8a25e8b1578'
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
