'use strict';

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
var EventsFactory = require('../../../lib/events');
var Event = EventsFactory.Event;

tape('EVENTS / ' + Event.SDK_READY + ' should be emitted once', function (assert) {
  var hub = EventsFactory();
  var counter = 0;

  hub.on(hub.Event.SDK_READY, function () {
    counter++;
  });
  hub.emit(hub.Event.SDK_READY);
  hub.emit(hub.Event.SDK_READY);

  assert.equal(counter, 1, 'called once');
  assert.end();
});

tape('EVENTS / should not emit ' + Event.SDK_UPDATE + ' if ' + Event.SDK_READY + ' is not emitted yet', function (assert) {
  var hub = EventsFactory();

  hub.on(hub.Event.SDK_UPDATE, function () {
    assert.fail('should not be called yet');
  });
  hub.emit(hub.Event.SDK_UPDATE);

  assert.pass('looks good');
  assert.end();
});