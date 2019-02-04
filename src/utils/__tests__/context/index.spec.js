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
import tape from 'tape-catch';
import Context from '../../context';
import ContextConsts from '../../context/constants';

tape('CONTEXT / Should have an API for storing and retrieving items', assert => {
  assert.equal(typeof Context, 'function', 'It should be a class.');
  const myContext = new Context();

  assert.equal(typeof myContext, 'object', 'When instantiated it should return an object');
  assert.equal(typeof myContext.put, 'function', 'with a function for storing things,');
  assert.equal(typeof myContext.get, 'function', 'a function for getting an item we previously stored,');
  assert.equal(typeof myContext.getAll, 'function', 'and a function for getting all the items that we\'ve previously stored.');
  assert.end();
});

tape('CONTEXT / Should expose the constants', assert => {
  const myContext = new Context();

  assert.deepEqual(myContext.constants, ContextConsts, 'Constants should be exposed from the context instance.');

  assert.end();
});

tape('CONTEXT / An instance should be able to store an item with a given name and return the result of the operation', assert => {
  const myContext = new Context();
  const itemToStore = { something: true };
  const anotherItemToStore = { somethingelse: true };

  assert.equal(myContext.put('test', itemToStore), true, 'Should store an item if a correct name was given.');
  assert.equal(myContext.put('test', anotherItemToStore), false, 'It should fail if we try to step on an existing item.');
  assert.equal(myContext.put(undefined, itemToStore), false, 'It should fail if no name is provided.');
  assert.equal(myContext.put(null, itemToStore), false, 'It should fail if the name provided is not a string.');
  assert.equal(myContext.put(false, itemToStore), false, 'It should fail if the name provided is not a string.');
  assert.equal(myContext.put(new Date, itemToStore), false, 'It should fail if the name provided is not a string.');
  assert.equal(myContext.put('', itemToStore), false, 'It should fail if the name is empty string.');
  assert.equal(myContext.put('test2'), false, 'It should fail if no item is provided.');
  assert.equal(myContext.put('test3', undefined), false, 'It should fail if no item is provided.');

  assert.end();
});

tape('CONTEXT / An instance should be able to retrieve stored items', assert => {
  const myContext = new Context();
  const itemToStore = { something: true };
  myContext.put('test', itemToStore);

  assert.equal(myContext.get('test'), itemToStore, 'It should retrieve an already stored item.');
  assert.equal(myContext.get('test'), itemToStore, 'Should be able to retrieve the same item as many times as needed.');
  assert.equal(myContext.get(''), undefined, 'If we pass an incorrect name we should get an "undefined".');
  assert.equal(myContext.get(null), undefined, 'If we pass an incorrect name we should get an "undefined".');

  assert.end();
});

tape('CONTEXT / An instance should return undefined until we have the item if we are performing a flag check.', assert => {
  const myContext = new Context();
  let value = myContext.get('test', true);

  assert.notOk(value instanceof Promise, 'If we try to check a flag but the value is not there, we just get undefined.');
  assert.equal(value, undefined, 'If we try to check a flag but the value is not there, we just get undefined.');

  value = myContext.get('test', true);
  assert.equal(value, undefined, 'The same happens for multiple attempts.');

  myContext.put('test', 'TeSt');

  value = myContext.get('test', 'TeSt');
  assert.equal(value, 'TeSt', 'Until the value is there and is returned.');
  assert.equal(myContext.get('test', true), 'TeSt', 'same thing happens multiple times.');

  assert.end();
});

tape('CONTEXT / An instance should return a promise if we try to get something we don\'t have stored unless we just want to check a flag.', assert => {
  const myContext = new Context();
  const itemPromise = myContext.get('test');

  assert.ok(itemPromise instanceof Promise, 'If we try to get an item not stored, we get a promise.');
  assert.equal(myContext.get('test'), itemPromise, 'and following attempts on same item will return the same promise.');

  assert.end();
});

tape('CONTEXT / If we store something someone is waiting for, it should resolve that promise and keep the value', assert => {
  const myContext = new Context();
  const itemToStore = { something: true };
  const itemPromise = myContext.get('test');

  setTimeout(() => myContext.put('test', itemToStore), 100);

  itemPromise.then(item => {
    assert.equal(item, itemToStore, 'Once we store something we generated a promise for, the promise should resolve to the item');
    assert.equal(myContext.get('test'), itemToStore, 'and the next time we ask for the item we will get the value instead of the promise.');

    assert.end();
  });

  return itemPromise;
});

tape('CONTEXT / If we store a promise, it should store the value once it is resolved', assert => {
  const myContext = new Context();
  const itemToStore = { something: true };
  const promiseToStore = new Promise(res => setTimeout(() => res(itemToStore), 50));
  myContext.put('test', promiseToStore);

  assert.equal(myContext.get('test'), promiseToStore, 'If we\'ve stored a promise, we will receive that promise until it is resolved.');
  assert.equal(myContext.get('test'), promiseToStore, 'Doesn\'t matter how many times, we should get the same promise.');

  promiseToStore.then(() => {
    assert.equal(myContext.get('test'), itemToStore, 'But once the promise is resolved, it should store the value and start returning it instead of the promise.');

    assert.end();
  });

  return promiseToStore;
});

tape('CONTEXT / If we store a promise, when that promise resolves it should store the value', assert => {
  const myContext = new Context();
  const itemToStore = { something: true };
  const itemPromise = new Promise(res => setTimeout(() => res(itemToStore), 100));

  assert.equal(myContext.put('test', itemPromise), true, 'We should be able to store a promise.');
  assert.equal(myContext.put('test', 'an item'), false, 'We shouldn\'t be able to step on that value manually.');
  assert.equal(myContext.get('test'), itemPromise, 'If we get the value before the promise is resolved, we receive the promise.');

  // This callback is attached at the end because for testing purposes, I need the one on the
  // context module attached first.
  return itemPromise.then(item => {
    assert.equal(item, itemToStore, 'The context module will propagate the value to which the promise was resolved.');
    assert.equal(myContext.get('test'), itemToStore, 'If we try to get the value now that the promise is resolved, we should get that value.');

    assert.end();
  });
});

tape('CONTEXT / If we store a promise, but that promise fails, it should clean up that item on the context', assert => {
  const myContext = new Context();
  const err = new Error('An error has occured.');
  const itemPromise = new Promise((res, rej) => setTimeout(() => rej(err), 100));
  const itemToStore = { something: true };

  myContext.put('test', itemPromise);
  assert.equal(myContext.get('test'), itemPromise, 'If we get the value before the promise is resolved, we receive the promise.');

  // This callback is attached at the end because for testing purposes, I need the one on the
  // context module to execute first.
  return itemPromise.then(() => {
    assert.ok(false, 'This should not happen on this scenario.');

    assert.end();
  }).catch(reason => {
    assert.equal(reason, err, 'If the promise is rejected, the error should propagate instead of doing a recovery.');
    assert.ok(myContext.put('test', itemToStore), 'So storing an item should be possible under that name again,');
    assert.equal(myContext.get('test'), itemToStore, 'and we should be able to get that item.');

    assert.end();
  });
});

tape('CONTEXT / Should be able to retrieve all items at once', assert => {
  const myContext = new Context();
  const item1 = { some: 'thing' };
  const item2 = () => {};
  const item3 = 38;

  myContext.put('test1', item1);
  myContext.put('test2', item2);
  myContext.put('test3', item3);

  const { test1, test2, test3 } = myContext.getAll();

  assert.equal(test1, item1, 'It should retrieve all items at once.');
  assert.equal(test2, item2, 'It should retrieve all items at once.');
  assert.equal(test3, item3, 'It should retrieve all items at once.');

  assert.end();
});

tape('CONTEXT / Different instances should have different storing maps', assert => {
  const context1 = new Context();
  const context2 = new Context();
  const itemToStore1 = { something: true };
  const itemToStore2 = () => {};
  context1.put('test', itemToStore1);
  context2.put('test', itemToStore2);

  assert.notEqual(context1.get('test'), context2.get('test'), 'Different instances should have their own map of items.');

  assert.end();
});
