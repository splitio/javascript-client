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

const tape = require('tape');

const SettingsFactory = require('../../../../utils/settings');
const settings = SettingsFactory({
  core: {
    authorizationKey: 'dummy-token'
  }
});

const EventsFactory = require('../../../../utils/events');
const hub = EventsFactory();

const storage = require('../../../storage').createStorage();
const segmentChangesUpdater = require('../../../updater/segmentChanges');

// mock list of segments to be fetched
storage.splits.getSegments = function getSegmentsMocked() {
  return new Set(['segment_1', 'segment_2', 'segment_3']);
};

tape('UPDATER SEGMENT CHANGES / without backend it should not fail', assert => {
  const updater = segmentChangesUpdater(settings, hub, storage);

  updater().then(() => {
    assert.equal([...storage.segments.segmentNames()].length, 0);
    assert.end();
  });
});
