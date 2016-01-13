'use strict';

var writer = require('split-cache').writer;

var log = require('debug')('split:cli');
var start = Date.now();

function forever() {
  let end;

  writer(/*process.env.SPLIT_TOKEN*/'epa57jv812r4602iu43no8jm1h')
    .then(storage => {
      storage.print();

      end = Date.now();

      log('update took %d seconds', (end - start) / 1000);

      start = end;

      setTimeout(forever, 5000); // update information each 5s
    })
    .catch(error => console.log(error))
}

forever();
