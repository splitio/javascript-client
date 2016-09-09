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

const ava = require('ava');
const EventsFactory = require('../../events');
const Event = EventsFactory.Event;

ava(`EVENTS / ${Event.SDK_READY} should be emitted once`, assert => {
  const hub = EventsFactory();
  let counter = 0;

  hub.on(hub.Event.SDK_READY, () => {
    counter++;
  });

  hub.emit(hub.Event.SDK_SPLITS_ARRIVED);
  hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
  hub.emit(hub.Event.SDK_SPLITS_ARRIVED);
  hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);
  hub.emit(hub.Event.SDK_SPLITS_ARRIVED);
  hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED);

  assert.equal(counter, 1, 'called once');
  assert.end();
});

ava(`EVENTS / should emit ${Event.SDK_UPDATE} after ${Event.SDK_READY}`, assert => {
  const hub = EventsFactory();
  let isReady = false;
  let counter = 0;

  hub.on(hub.Event.SDK_READY, () => {
    counter++;
    isReady = true;
  });

  hub.on(hub.Event.SDK_UPDATE, () => {
    isReady && (counter++);
  });

  hub.emit(hub.Event.SDK_SPLITS_ARRIVED);
  hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED); // counter = 1

  hub.emit(hub.Event.SDK_SPLITS_ARRIVED);   // counter = 2
  hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED); // counter = 3
  hub.emit(hub.Event.SDK_SPLITS_ARRIVED);   // counter = 4
  hub.emit(hub.Event.SDK_SEGMENTS_ARRIVED); // counter = 5

  assert.equal(counter, 5, 'counter should have a 5');
  assert.end();
});
