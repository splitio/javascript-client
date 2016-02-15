'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var tape = require('tape');
var utils = require('../../../lib/engine/utils');
var csv = require('csv-streamify');
var fs = require('fs');

tape('ENGINE / validate hashing behavior using sample data', function (assert) {
  var parser = csv();

  parser.on('data', function (line) {
    var _JSON$parse = JSON.parse(line.toString('utf8').trim());

    var _JSON$parse2 = _slicedToArray(_JSON$parse, 4);

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