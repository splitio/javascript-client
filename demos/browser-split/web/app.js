'use strict';

console.log('SPLIT DEMO!');
console.log(
  'Early evaluation of feature \'sdk\' before startup the engine =>',
  splitio.getTreatment('sdk', 'default-treatment')
);

splitio.start({
  core: {
    authorizationKey: 'c1l5vkd50gimccout3c03pntbu',
    key: '4a2c4490-ced1-11e5-9b97-d8a25e8b1578'
  },
  scheduler: {
    metricsRefreshRate: 2000
  }
}).then(function() {
  console.log(
    'Evaluation of feature \'sdk\' after startup the engine =>',
    splitio.getTreatment('sdk', 'default-treatment')
  );
}).catch(function(error) {
  console.log(error);
});
