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
  const anotherItemToStore = {
    somethingelse: true
  };

  assert.equal(myContext.put('test', itemToStore), true, 'Should store an item if a correct name was given.');
  assert.equal(myContext.put('test', anotherItemToStore), false, 'It should fail if we try to step on an existing item.');
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

tape('CONTEXT / An instance should return a promise if we try to get something we don\'t have stored.', assert => {
  const myContext = new Context();
  const itemPromise = myContext.get('test');

  assert.ok(itemPromise instanceof Promise, 'If we try to get an item not stored, we get a promise.');
  assert.equal(myContext.get('test'), itemPromise, 'and following attempts on same item will return the same promise.');

  assert.end();
});

tape('CONTEXT / If we store something someone is waiting for, it should resolve that promise and keep the value', assert => {
  const myContext = new Context();
  const itemToStore = {
    something: true
  };
  const itemPromise = myContext.get('test');

  setTimeout(() => {
    myContext.put('test', itemToStore);
  }, 100);

  itemPromise.then(item => {
    assert.equal(item, itemToStore, 'Once we store something we generated a promise for, the promise should resolve to the item');
    assert.equal(myContext.get('test'), itemToStore, 'and the next time we ask for the item we will get the value instead of the promise.');

    assert.end();
  });

  return itemPromise;
});

tape('CONTEXT / If we store a promise, it should store the value once it is resolved', assert => {
  const myContext = new Context();
  const itemToStore = {
    something: true
  };
  const promiseToStore = new Promise(res => {
    setTimeout(() => {
      res(itemToStore);
    }, 50);
  });
  myContext.put('test', promiseToStore);

  assert.equal(myContext.get('test'), promiseToStore, 'If we\'ve stored a promise, we will receive a promise until it is resolved.');

  promiseToStore.then(() => {
    assert.equal(myContext.get('test'), itemToStore, 'But once the promise is resolved, it should store the value and start returning it instead of the promise.');

    assert.end();
  });

  return promiseToStore;
});

tape('CONTEXT / Different instances should have different storing maps', assert => {
  const context1 = new Context();
  const context2 = new Context();
  const itemToStore1 = {
    something: true
  };
  const itemToStore2 = () => {};
  context1.put('test', itemToStore1);
  context2.put('test', itemToStore2);

  assert.notEqual(context1.get('test'), context2.get('test'), 'Different instances should have their own map of items.');

  assert.end();
});
