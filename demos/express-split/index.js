'use strict';

var app = require('express')();
var sdk;

if (process.env.NODE_ENV === 'offline') {
  sdk = require('@splitsoftware/splitio/lib/offline')({
    features: {
      sdk: 'on'
    }
  });
} else {
  sdk = require('@splitsoftware/splitio')({
    core: {
      authorizationKey: 'l1le2jmg4ksjhh1gh671r4aj5tgl9hukrqlv'
    }/*,
    scheduler: {
      featuresRefreshRate: 1,    // fetch feature updates each 1 sec
      segmentsRefreshRate: 1,    // fetch segment updates each 1 sec
      metricsRefreshRate: 30,    // publish metrics each 30 sec
      impressionsRefreshRate: 30 // publish evaluations each 30 sec
    }*/
  });
}

app.use(function (req, res, next) {
  if (sdk.getTreatment('key_7663', 'test_52') === 't_2') {
    next();
  } else {
    res.sendStatus(403);
  }
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

sdk.ready().then(function() {
  app.listen(8889, function () {
    console.log('Check sample using curl -v http://localhost:8889');
  });
});
