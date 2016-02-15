'use strict';

var express = require('express');
var app = express();

var split = require('@splitsoftware/splitio');
var splitEngine = null;

app.use(function (req, res, next) {
  if (splitEngine) {
    if (splitEngine.getTreatment('4a2c4490-ced1-11e5-9b97-d8a25e8b1578', 'off') === 'on') {
      next();
    } else {
      res.sendStatus(403);
    }
  } else {
    next();
  }
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(8889, function serverStarted() {
  split({
    cache: {
      authorizationKey: 'c1l5vkd50gimccout3c03pntbu'
    }
    // },
    // scheduler: {
    //   featuresRefreshRate: 5000,
    //   segmentsRefreshRate: 5000 * 3
    // }
  })
  .then(function (engine) {
    splitEngine = engine;
  })
  .catch(function (error) {
    console.log('Something went wrong while doing the startup of Split');
    console.log(error);
  });

  console.log('Example app listening on port 5000!');
});
