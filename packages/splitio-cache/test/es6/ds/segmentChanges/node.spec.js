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
const settings = require('@splitsoftware/splitio-utils/lib/settings').configure({
  core: {
    authorizationKey: 'dummy-token'
  }
});
const url = settings.url;

const greedyFetch = require('../../../../lib/ds/segmentChanges').greedyFetch.bind(null, -1);
const fetchMock = require('fetch-mock');

const tape = require('tape');

tape('DS SEGMENT CHANGES / greedy fetch should download while since != till', assert => {
  const response1 = {
    name: 'segment_1',
    added: [
      1, 2
    ],
    removed: [],
    since: 1,
    till: 2
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=-1');
  }, JSON.stringify(response1));

  const response2 = {
    name: 'segment_1',
    added: [
      3, 4
    ],
    removed: [],
    since: 2,
    till: 3
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=2');
  }, JSON.stringify(response2));

  const response3 = {
    name: 'segment_1',
    added: [
      5, 6
    ],
    removed: [],
    since: 3,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=3');
  }, JSON.stringify(response3));

  const response4 = {
    name: 'segment_1',
    added: [],
    removed: [],
    since: 4,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=4');
  }, JSON.stringify(response4));

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

tape('DS SEGMENT CHANGES / ', assert => {
  const response1 = {
    name: 'segment_1',
    added: [
      1, 2
    ],
    removed: [],
    since: 1,
    till: 2
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=-1');
  }, JSON.stringify(response1));

  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=2');
  }, {
    status: 500
  });

  const response3 = {
    name: 'segment_1',
    added: [
      5, 6
    ],
    removed: [],
    since: 3,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=3');
  }, JSON.stringify(response3));

  greedyFetch('segment_1').then(function (responses) {
    assert.equal(responses.length, 1);

    assert.deepEqual(responses[0], response1);

    fetchMock.restore();
    assert.end();
  });
});

tape('DS SEGMENT CHANGES / greedy fetch stop fetching if one response fails', assert => {
  const response1 = {
    name: 'segment_1',
    added: [
      1, 2
    ],
    removed: [],
    since: 1,
    till: 2
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=-1');
  }, JSON.stringify(response1));

  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=2');
  }, {
    status: 500
  });

  const response3 = {
    name: 'segment_1',
    added: [
      5, 6
    ],
    removed: [],
    since: 3,
    till: 4
  };
  fetchMock.mock(function (request) {
    return request.url === url('/segmentChanges/segment_1?since=3');
  }, JSON.stringify(response3));

  greedyFetch('segment_1').then(function (responses) {
    assert.equal(responses.length, 1);

    assert.deepEqual(responses[0], response1);

    fetchMock.restore();
    assert.end();
  });
});
