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

const tape = require('tape-catch');
const timer = require('../../timeTracker/timer');
const tracker = require('../../timeTracker');

tape('TIMER / should count the time between two tasks', assert => {
  const timerDuration = Math.floor(Math.random() * 1000); // In millis
  const stopTimer = timer();

  setTimeout(() => {
    const elapsedTime = stopTimer();

    assert.true(elapsedTime >= timerDuration - 10, 'Timer should return correct difference (calculations made with +-10ms)');
    assert.true(elapsedTime <= timerDuration + 10, 'Timer should return correct difference (calculations made with +-10ms)');
    assert.end();
  }, timerDuration);
});

tape('TIME TRACKER / should have the correct API', assert => {
  assert.equal(typeof tracker.start, 'function', 'It should have the correct API.');
  assert.equal(typeof tracker.startUnique, 'function', 'It should have the correct API.');
  assert.equal(typeof tracker.stop, 'function', 'It should have the correct API.');
  assert.equal(typeof tracker.setupTrackers, 'function', 'It should have the correct API.');
  assert.equal(typeof tracker.C, 'object', 'It should have the correct API.');
  assert.end();
});

tape('TIME TRACKER start() / should return the correct type', assert => {
  const promise = new Promise(res => {
    setTimeout(res, 500);
  });
  const startNormal = tracker.start('fakeTask1');
  const startWithPromise = tracker.start('fakeTask2', promise);

  assert.equal(typeof startNormal, 'undefined', 'If we call start with only a task name, it will return undefined');
  assert.deepEqual(startWithPromise, promise, 'But if we also pass a promise, we will get that promise back');

  assert.end();
});

tape('TIME TRACKER startUnique() / should return the correct type', assert => {
  const promise = new Promise(res => {
    setTimeout(res, 500);
  });
  const startNormal = tracker.startUnique('fakeTask3');
  const startWithPromise = tracker.startUnique('fakeTask4', promise);

  assert.equal(typeof startNormal, 'function', 'If we call start with only a task name, it will return the stop function.');
  assert.deepEqual(startWithPromise, promise, 'But if we also pass a promise, we will get that promise back.');

  assert.end();
});

tape('TIME TRACKER stop() / should stop the timer and return the time, if any', assert => {
  tracker.start('test_task');
  const stopFromStartUnique = tracker.startUnique('fakeTask5');

  const stopNotExistentTask = tracker.stop('not_existent');
  const stopNotExistentTaskAndModifier = tracker.stop('test_task', 'mod');
  const stopExistingTask = tracker.stop('test_task');

  assert.equal(typeof stopNotExistentTask, 'undefined', 'If we try to stop a timer that does not exist, we get undefined.');
  assert.equal(typeof stopNotExistentTaskAndModifier, 'undefined', 'If we try to stop a timer that does not exist, we get undefined.');
  assert.equal(typeof stopExistingTask, 'number', 'But if we stop an existing task, we get a number.');
  assert.equal(typeof stopFromStartUnique(), 'number', 'But if we stop an existing task from the startUnique() returned function, we get a number.');

  assert.end();
});
