'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

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

// Minimal settings required
require('@splitsoftware/splitio-utils/lib/settings').configure({
  core: {
    authorizationKey: 'asd'
  }
});

var greedyFetch = require('../../../../lib/ds/segmentChanges').greedyFetch.bind(null, -1);
var fetchMock = require('fetch-mock');

var tape = require('tape');
var url = require('@splitsoftware/splitio-utils/lib/url');

tape('DS SEGMENT CHANGES / greedy fetch should download while since != till', function (assert) {
  var response1 = {
    name: 'segment_1',
    added: [1, 2],
    removed: [],
    since: 1,
    till: 2
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=-1');
  }, (0, _stringify2.default)(response1));

  var response2 = {
    name: 'segment_1',
    added: [3, 4],
    removed: [],
    since: 2,
    till: 3
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=2');
  }, (0, _stringify2.default)(response2));

  var response3 = {
    name: 'segment_1',
    added: [5, 6],
    removed: [],
    since: 3,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=3');
  }, (0, _stringify2.default)(response3));

  var response4 = {
    name: 'segment_1',
    added: [],
    removed: [],
    since: 4,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=4');
  }, (0, _stringify2.default)(response4));

  greedyFetch('segment_1').then(function (responses) {
    assert.equal(responses.length, 4);

    assert.deepEqual(responses[0], response1);
    assert.deepEqual(responses[1], response2);
    assert.deepEqual(responses[2], response3);
    assert.deepEqual(responses[3], response4);

    fetchMock.restore();
    assert.end();
  });
});

tape('DS SEGMENT CHANGES / ', function (assert) {
  var response1 = {
    name: 'segment_1',
    added: [1, 2],
    removed: [],
    since: 1,
    till: 2
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=-1');
  }, (0, _stringify2.default)(response1));

  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=2');
  }, {
    status: 500
  });

  var response3 = {
    name: 'segment_1',
    added: [5, 6],
    removed: [],
    since: 3,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=3');
  }, (0, _stringify2.default)(response3));

  greedyFetch('segment_1').then(function (responses) {
    assert.equal(responses.length, 1);

    assert.deepEqual(responses[0], response1);

    fetchMock.restore();
    assert.end();
  });
});

tape('DS SEGMENT CHANGES / greedy fetch stop fetching if one response fails', function (assert) {
  var response1 = {
    name: 'segment_1',
    added: [1, 2],
    removed: [],
    since: 1,
    till: 2
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=-1');
  }, (0, _stringify2.default)(response1));

  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=2');
  }, {
    status: 500
  });

  var response3 = {
    name: 'segment_1',
    added: [5, 6],
    removed: [],
    since: 3,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=3');
  }, (0, _stringify2.default)(response3));

  greedyFetch('segment_1').then(function (responses) {
    assert.equal(responses.length, 1);

    assert.deepEqual(responses[0], response1);

    fetchMock.restore();
    assert.end();
  });
});
//# sourceMappingURL=node.spec.js.map