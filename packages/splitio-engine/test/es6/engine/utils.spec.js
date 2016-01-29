'use strict';

var tape = require('tape');
var utils = require('../../../lib/engine/utils');

let csv = require('csv-streamify');
let fs = require('fs');

tape('Validate hashing behavior using sample data', assert => {
  let parser = csv();

  parser.on('data', line => {
    let [seed, key, hash, bucket] = JSON.parse( line.toString('utf8').trim() );

    seed = parseInt(seed, 10);
    hash = parseInt(hash, 10);
    bucket = parseInt(bucket, 10);

    assert.equal(utils.hash(key, seed), hash, 'matching using int32 hash value');
    assert.equal(utils.bucket(key, seed), bucket, 'matching using int32 bucket value');
  }).on('end', assert.end);

  fs.createReadStream(require.resolve('./mocks/small-data.csv')).pipe(parser);
});
