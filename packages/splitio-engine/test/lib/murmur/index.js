'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var murmur = require('murmurhash-js');
var tape = require('tape');

var datasets = [require('./mocks/1000_keys_of_length_10'), require('./mocks/10000_keys_of_length_10'), require('./mocks/100000_keys_of_length_10')];

function engine(key, seed) {
  return murmur(key, seed) % 100;
}

function stats(keys) {
  var numberOfBuckets = 100;
  var universeSize = keys.length;
  var collisionCounter = new Map();
  var probabilityDistribution = new Map();

  // translate values to bucket and accumulate collisions
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = keys[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var k = _step.value;

      var bucket = engine(k, 424344136);

      collisionCounter.set(bucket, (collisionCounter.get(bucket) || 0) + 1);
    }

    // calculate probability of each bucket
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = collisionCounter[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _step2$value = _slicedToArray(_step2.value, 2);

      var bucket = _step2$value[0];
      var collisions = _step2$value[1];

      probabilityDistribution.set(bucket, collisions / universeSize);
    }

    // @TODO Test around 0.01

    //
    // We expect always # keys / 100 buckets will be equal, so we distribute elements
    // using that expectation (validated before with the 0.01 test).
    //
    // Given it's an experiment were it's in the bucket, or not, we could analyse the
    // problem as follow:
    //
    // - Each bucket will have N = 1000 keys (assuming a universe of 100000 keys )
    // - The probability P of success is 0.01
    // - The probability Q of failure is 0.99
    //
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var n = universeSize / numberOfBuckets;
  var p = 0.01;
  var q = 1 - p;

  var mean = n * p;
  var sd = Math.sqrt(n * p * q);

  //  for (let [b, p] of p) {
  //    mean += b * p;
  //  }
  //
  //  for (let [b, p] of p) {
  //    sd += p * Math.pow(b - mean, 2);
  //  }
  //  sd = Math.sqrt(sd);

  console.log('================================================================');
  console.log('Mean for ' + keys.length + ' keys of length 10: ' + mean.toFixed(2));
  console.log('SD for ' + keys.length + ' keys of length 10: ' + sd.toFixed(2));
  console.log('==> Rule 68-95-99.7');
  console.log('68.27% will be between ' + (mean - sd) + ' and ' + (mean + sd));
  console.log('95.45% will be between ' + (mean - 2 * sd) + ' and ' + (mean + 2 * sd));
  console.log('99.73% will be between ' + (mean - 3 * sd) + ' and ' + (mean + 3 * sd));
}

datasets.forEach(stats);
//# sourceMappingURL=index.js.map