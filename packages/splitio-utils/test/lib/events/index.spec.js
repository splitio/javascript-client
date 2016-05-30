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
var eventsHandler = require('../../../lib/events');
var events = eventsHandler.events;

tape('EVENTS / should not emit event update if ready event it isn\'t emmited', function (assert) {
  eventsHandler.removeAllListeners();

  assert.plan(1);

  eventsHandler.on(events.SDK_UPDATE, function () {
    assert.fail('EVENT SDK_UPDATE has not to be emmited if SDK_READY event it is not emmited before');
  });

  eventsHandler.emit(events.SDK_UPDATE);

  assert.ok(!eventsHandler.isReady(), 'isReady should be false');
});

tape('EVENTS / should emmit and listen to event SDK_READY', function (assert) {
  eventsHandler.removeAllListeners();

  assert.plan(2);

  eventsHandler.on(events.SDK_READY, function () {
    assert.pass('SDK_READY event listened');
  });

  eventsHandler.emit(events.SDK_READY);

  assert.ok(eventsHandler.isReady(), 'isReady should be true');
});

tape('EVENTS / should emmit and listen to event SDK_UPDATE', function (assert) {
  eventsHandler.removeAllListeners();

  assert.plan(2);

  eventsHandler.on(events.SDK_UPDATE, function () {
    assert.pass('SDK_UPDATE event listened');
  });

  eventsHandler.emit(events.SDK_READY);
  eventsHandler.emit(events.SDK_UPDATE);

  assert.ok(eventsHandler.isReady(), 'isReady should be true');
});

tape('EVENTS / should emmit and listen to event SDK_UPDATE_ERROR', function (assert) {
  eventsHandler.removeAllListeners();

  assert.plan(2);

  eventsHandler.on(events.SDK_UPDATE_ERROR, function () {
    assert.pass('SDK_UPDATE_ERROR event listened');
  });

  eventsHandler.emit(events.SDK_READY);
  eventsHandler.emit(events.SDK_UPDATE_ERROR);

  assert.ok(eventsHandler.isReady(), 'isReady should be true');
});