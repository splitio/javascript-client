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
'use strict';

const SettingsFactory = require('../../../../utils/settings');
const settings = SettingsFactory({
  core: {
    authorizationKey: 'dummy-token'
  }
});
const url = settings.url.bind(settings);

const greedyFetch = require('../../../ds/segmentChanges').greedyFetch.bind(null, settings, -1);
const fetchMock = require('fetch-mock');

const ava = require('ava');

ava('DS SEGMENT CHANGES / greedy fetch should download while since != till', assert => {
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
    const len = responses.length;
    const last = len - 1;

    assert.equal(len, 4);

    assert.deepEqual(responses[0], response1, 'response #1 should be at position 0');
    assert.deepEqual(responses[1], response2, 'response #2 should be at position 1');
    assert.deepEqual(responses[2], response3, 'response #3 should be at position 2');
    assert.deepEqual(responses[3], response4, 'response #4 should be at position 3');

    assert.equal(responses[last].since, responses[last].till, 'response #4 should have since === till');

    fetchMock.restore();
    assert.end();
  });
});

ava('DS SEGMENT CHANGES / greedy fetch stop fetching if one response fails', assert => {
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
