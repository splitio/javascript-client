'use strict';

const app = require('express')();
const splitio = require('@splitsoftware/splitio');
let sdk;

if (process.env.SPLIT_SDK_MODE === 'offline') {
  console.log('offline mode');
  sdk = splitio({
    core: {
      authorizationKey: 'localhost'
    }
  });
} else {
  sdk = splitio({
    core: {
      authorizationKey: 'emco6aj80nu9ehoq58u9svugucdkotfo8gp3'
    },
    urls: {
      sdk: 'https://sdk-staging.split.io/api',
      events: 'https://events-staging.split.io/api'
    },
    scheduler: {
      featuresRefreshRate: 15,    // fetch feature updates each 1 sec
      segmentsRefreshRate: 15,    // fetch segment updates each 1 sec
      metricsRefreshRate: 30,    // publish metrics each 30 sec
      impressionsRefreshRate: 30 // publish evaluations each 30 sec
    }
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

sdk.on('state::ready', function() {
  console.log('Testing sdk event ready: ', arguments);
});
