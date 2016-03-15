'use strict';

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

var tape = require('tape');
var utils = require('../../../lib/engine/utils');
var csv = require('csv-streamify');
var fs = require('fs');

tape('ENGINE / validate hashing behavior using sample data', function (assert) {
  var parser = csv();

  parser.on('data', function (line) {
    var _JSON$parse = JSON.parse(line.toString('utf8').trim());

    var _JSON$parse2 = (0, _slicedToArray3.default)(_JSON$parse, 4);

    var seed = _JSON$parse2[0];
    var key = _JSON$parse2[1];
    var hash = _JSON$parse2[2];
    var bucket = _JSON$parse2[3];


    seed = parseInt(seed, 10);
    hash = parseInt(hash, 10);
    bucket = parseInt(bucket, 10);

    assert.equal(utils.hash(key, seed), hash, 'matching using int32 hash value');
    assert.equal(utils.bucket(key, seed), bucket, 'matching using int32 bucket value');
  }).on('end', assert.end);

  fs.createReadStream(require.resolve('./mocks/small-data.csv')).pipe(parser);
});
//# sourceMappingURL=utils.spec.js.map