'use strict';

console.log('SPLIT DEMO!');

splitio.start({
  cache: {
    authorizationKey: 'c1l5vkd50gimccout3c03pntbu',
    key: '4a2c4490-ced1-11e5-9b97-d8a25e8b1578'
  },
  scheduler: {
    featuresRefreshRate: 5000,
    segmentsRefreshRate: 5000 * 3
  }
}).then(function() {
  console.log('Feature ' + ( splitio.isOn('sdk') ? 'enabled! :D' : 'disabled :|' ) );
}).catch(function(error) {
  console.log(error);
});
