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
const Context = require('../../context');

tape('CONTEXT / Should have an API for storing and retrieving items', assert => {
  assert.equal(typeof Context, 'function', 'It should be a class.');
  const myContext = new Context();

  assert.equal(typeof myContext, 'object', 'When instantiated it should return an object');
  assert.equal(typeof myContext.put, 'function', 'with a function for storing things');
  assert.equal(typeof myContext.get, 'function', 'and a function for getting what we previously stored.');
  assert.end();
});

tape('CONTEXT / An instance should be able to store an item with a given name and return the result of the operation', assert => {
  const myContext = new Context();
  const itemToStore = {
    something: true
  };

  assert.equal(myContext.put('test', itemToStore), true, 'Should store an item if a correct name was given.');
  assert.equal(myContext.put(undefined, itemToStore), false, 'It should fail if no name is provided.');
  assert.equal(myContext.put('', itemToStore), false, 'It should fail if the name is empty string.');
  assert.equal(myContext.put('test'), false, 'It should fail if no item is provided.');

  assert.end();
});

tape('CONTEXT / An instance should be able to retrieve stored items', assert => {
  const myContext = new Context();
  const itemToStore = {
    something: true
  };
  myContext.put('test', itemToStore);

  assert.equal(myContext.get('test'), itemToStore, 'It should retrieve an already stored item.');
  assert.equal(myContext.get('test'), itemToStore, 'Should be able to retrieve the same item as many times as needed.');
  assert.equal(myContext.get(''), undefined, 'If we pass an incorrect name we should get an "undefined".');
  assert.equal(myContext.get(null), undefined, 'If we pass an incorrect name we should get an "undefined".');

  assert.end();
});



// tape('TIME TRACKER start() / should return the correct type', assert => {
//   const promise = new Promise(res => {
//     setTimeout(res, 1000);
//   });
//   promise.crap = true;
//   const startNormal = tracker.start(tracker.TaskNames.SDK_READY);
//   const startNormalFake = tracker.start('fakeTask3');
//   const startWithPromise = tracker.start('fakeTask4', false, promise);

//   assert.equal(typeof startNormal, 'function', 'If we call start without a promise, it will return the stop function,');
//   assert.equal(typeof startNormal.setCollectorForTask, 'function', 'that has a function as well for setting the collector at a defered time, because it has a registered cb but no collector received.');
//   assert.equal(typeof startNormalFake.setCollectorForTask, 'undefined', 'If no callback is registered for the task, no collectors setup function is attached to returned one.');
//   assert.equal(typeof startWithPromise.then, 'function', 'But if we pass a promise, we will get a promise back, with the necessary callbacks already handled.');

//   assert.end();
// });
