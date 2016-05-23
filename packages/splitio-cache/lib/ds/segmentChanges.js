'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

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

var segmentChangesService = require('@splitsoftware/splitio-services/lib/segmentChanges');
var segmentChangesRequest = require('@splitsoftware/splitio-services/lib/segmentChanges/get');

var segmentMutatorFactory = require('../mutators/segmentChanges');
var cache = new _map2.default();

function greedyFetch(since, segmentName) {
  return segmentChangesService(segmentChangesRequest({
    since: since,
    segmentName: segmentName
  })).then(function (resp) {
    return resp.json();
  }).then(function (json) {
    var since = json.since;
    var till = json.till;


    if (since === till) {
      return [json];
    } else {
      return _promise2.default.all([json, greedyFetch(json.till, segmentName)]).then(function (flatMe) {
        return [flatMe[0]].concat((0, _toConsumableArray3.default)(flatMe[1]));
      });
    }
  }).catch(function () {
    // if something goes wrong with the request to the server, we are going to
    // stop requesting information till the next round of downloading
    return [];
  });
}

function segmentChangesDataSource(segmentName) {
  var since = cache.get(segmentName) || -1;

  return greedyFetch(since, segmentName).then(function (changes) {
    var len = changes.length;

    if (len > 0) {
      cache.set(segmentName, changes[len - 1].till);

      return segmentMutatorFactory(changes);
    }
  });
}

module.exports = segmentChangesDataSource;
module.exports.greedyFetch = greedyFetch;
module.exports.cache = cache;