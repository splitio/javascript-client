'use strict';

var express = require('express');
var app = express();

var split = require('splitio');
var splitEngine = null;

app.use(function split(req, res, next) {
  if (splitEngine) {
    if (splitEngine.isOn('userId', 'hello_world')) {
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

app.listen(5000, function serverStarted() {

  split('epa57jv812r4602iu43no8jm1h')
    .then(function (engine) {
      splitEngine = engine;
    })
    .catch(function (error) {
      console.log('Something went wrong while doing the startup of Split');
      console.log(error);
    });

  console.log('Example app listening on port 5000!');
});
