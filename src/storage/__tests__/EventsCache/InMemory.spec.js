const tape = require('tape');
const EventsCache = require('../../EventsCache/InMemory');

tape('EVENTS CACHE / Should be able to instantiate and start with an empty queue', assert => {
  let cache;
  const createInstance = () => cache = new EventsCache;

  assert.doesNotThrow(createInstance, 'Creation should not throw.');
  assert.deepEqual(cache.state(), [], 'The queue starts empty.');
  assert.end();
});

tape('EVENTS CACHE / Should be able to add items sequentially and retrieve the queue', assert => {
  const cache = new EventsCache;
  const queueValues = [1, '2', { p: 3 }, ['4']];

  assert.doesNotThrow(cache.track.bind(cache, queueValues[0]), 'Calling track should not throw');
  // Testing the throw on one is enough.
  cache.track(queueValues[1]);
  cache.track(queueValues[2]);
  cache.track(queueValues[3]);

  const state = cache.state();

  assert.equal(state.length, 4 /* pushed 4 items */, 'The amount of items on queue should match the amount we pushed');
  assert.deepEqual(state, queueValues, 'The items should be in the queue and ordered as they were added.');

  assert.end();
});

tape('EVENTS CACHE / Should be able to clear the queue', assert => {
  const cache = new EventsCache;

  cache.track('test1');
  cache.clear();

  assert.deepEqual(cache.state(), [], 'The queue should be clear.');
  assert.end();
});

tape('EVENTS CACHE / Should be able to tell if the queue is empty', assert => {
  const cache = new EventsCache;

  assert.true(cache.state().length === 0, 'The queue is empty,');
  assert.true(cache.isEmpty(), 'so if it is empty, it returns true.');

  cache.track('test');

  assert.true(cache.state().length > 0, 'If we add something to the queue,');
  assert.false(cache.isEmpty(), 'it will return false.');

  assert.end();
});

tape('EVENTS CACHE / Should be able to return the DTO we will send to BE', assert => {
  const cache = new EventsCache;
  const queueValues = [1, '2', { p: 3 }, ['4']];

  cache.track(queueValues[0]);
  cache.track(queueValues[1]);
  cache.track(queueValues[2]);
  cache.track(queueValues[3]);

  const json = cache.toJSON();

  assert.deepEqual(json, queueValues, 'For now the DTO is just an array of the saved events.');

  assert.end();
});
