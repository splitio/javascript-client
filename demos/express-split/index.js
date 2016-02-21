'use strict';

var app = require('express')();
var sdk;

if (process.env.NODE_ENV === 'development') {
  sdk = require('@splitsoftware/splitio/lib/offline')({
    features: {
      sdk: 'on'
    }
  });
} else {
  sdk = require('@splitsoftware/splitio')({
    core: {
      authorizationKey: 'c1l5vkd50gimccout3c03pntbu'
    },
    scheduler: {
      // featuresRefreshRate: 5000,
      // segmentsRefreshRate: 5000 * 3
      metricsRefreshRate: 10000
    }
  });
}

app.use(function (req, res, next) {
  if (sdk.getTreatment('4a2c4490-ced1-11e5-9b97-d8a25e8b1578', 'sdk') === 'on') {
    next();
  } else {
    res.sendStatus(403);
  }
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(8889, function () {
  console.log('Check sample using curl -v http://localhost:8889');
});
