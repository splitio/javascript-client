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
  features: {
    'sdk': 'on',
    'payment_system': 'visa',
    'airline_company': 'delta'
  }
});

//
// Some simple cases for my defined features
//
console.assert(
  sdk.getTreatment('optional key could be provided', 'sdk') === 'on',
  "Expected answer because we defined it as 'on'"
);
console.assert(
  sdk.getTreatment('optional key could be provided', 'payment_system') === 'visa',
  "Expected answer because we defined it as 'visa'"
);
console.assert(
  sdk.getTreatment('optional key could be provided', 'airline_company') === 'delta',
  "Expected answer because we defined it as 'delta'"
);

//
// The engine by default will answer with 'control' treatment as a notification for
// you when he doesn't have data to make a decision.
//
console.assert(
  sdk.getTreatment('optional key could be provided', 'unknown_feature') === 'control',
  "The engine will answer 'control' each time there is none data available"
);
