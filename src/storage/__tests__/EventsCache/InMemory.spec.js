const tape = require('tape');
const EventsCache = require('../../EventsCache/InMemory');
const Context = require('../../../utils/context'); // Has it's own unit test.

const CONTEXT = new Context;
CONTEXT.put(CONTEXT.constants.SETTINGS, {
  scheduler: {
    eventsQueueSize: 500
  }
});

tape('EVENTS CACHE / Should be able to instantiate and start with an empty queue', assert => {
  let cache;
  const createInstance = () => cache = new EventsCache(CONTEXT);

  assert.doesNotThrow(createInstance, 'Creation should not throw.');
  assert.deepEqual(cache.state(), [], 'The queue starts empty.');
  assert.end();
});

tape('EVENTS CACHE / Should be able to add items sequentially and retrieve the queue', assert => {
  const cache = new EventsCache(CONTEXT);
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
  const cache = new EventsCache(CONTEXT);

  cache.track('test1');
  cache.clear();

  assert.deepEqual(cache.state(), [], 'The queue should be clear.');
  assert.end();
});

tape('EVENTS CACHE / Should be able to tell if the queue is empty', assert => {
  const cache = new EventsCache(CONTEXT);

  assert.true(cache.state().length === 0, 'The queue is empty,');
  assert.true(cache.isEmpty(), 'so if it is empty, it returns true.');

  cache.track('test');

  assert.true(cache.state().length > 0, 'If we add something to the queue,');
  assert.false(cache.isEmpty(), 'it will return false.');

  assert.end();
});

tape('EVENTS CACHE / Should be able to return the DTO we will send to BE', assert => {
  const cache = new EventsCache(CONTEXT);
  const queueValues = [1, '2', { p: 3 }, ['4']];

  cache.track(queueValues[0]);
  cache.track(queueValues[1]);
  cache.track(queueValues[2]);
  cache.track(queueValues[3]);

  const json = cache.toJSON();

  assert.deepEqual(json, queueValues, 'For now the DTO is just an array of the saved events.');

  assert.end();
});

tape('EVENTS CACHE / Should call the "flushAndResetTimer" of the events module if the queue is full and the events module is present for this instance.', assert => {
  // That it doesn't throw without events being ready is covered on the previous tests.
  const ctx = new Context;
  ctx.put(ctx.constants.SETTINGS, {
    scheduler: {
      eventsQueueSize: 3
    }
  });
  let cbCalled = 0;
  const cache = new EventsCache(ctx);
  // Once the events module is ready on the context
  ctx.get(ctx.constants.EVENTS).then(() => {
    assert.equal(cbCalled, 1, 'Once events is ready, if we had the queue full, it should flush events.');
    cache.track(1);
    assert.equal(cbCalled, 1, 'After that, while the queue is below max size, it should not try to flush it.');
    cache.track(2);
    assert.equal(cbCalled, 1, 'After that, while the queue is below max size, it should not try to flush it.');
    cache.track(3);
    assert.equal(cbCalled, 2, 'Once we get to the max size, it should try to flush it.');
    cache.track(4);
    assert.equal(cbCalled, 2, 'And it should not flush again,');
    cache.track(5);
    assert.equal(cbCalled, 2, 'And it should not flush again,');
    cache.track(6);
    assert.equal(cbCalled, 3, 'Until the queue is filled with events again.');

    assert.end();
  });
  // More items than max queue
  cache.track(0);
  cache.track(0);
  cache.track(0);
  cache.track(0);

  assert.equal(cbCalled, 0, 'Of course, until events is not ready, it will not be able to run the callback.');

  ctx.put(ctx.constants.EVENTS, {
    flushAndResetTimer: () => { cbCalled++; cache.clear(); }
  });
});

tape('EVENTS CACHE / Should not call the "flushAndResetTimer" of the events module if the queue never gets full.', assert => {
  const ctx = new Context;
  ctx.put(ctx.constants.SETTINGS, {
    scheduler: {
      eventsQueueSize: 3
    }
  });
  let cbCalled = 0;
  const cache = new EventsCache(ctx);
  // Once the events module is ready on the context
  ctx.get(ctx.constants.EVENTS).then(() => {
    assert.equal(cbCalled, 0, 'Events is ready but queue is not on max capacity, should not flush.');
    cache.track(1);
    assert.equal(cbCalled, 0, 'Still under the max size, no flush.');

    assert.end();
  });

  // Added just one item
  cache.track(0);

  assert.equal(cbCalled, 0, 'Of course, until events is not ready, it will not be able to run the callback.');

  ctx.put(ctx.constants.EVENTS, {
    flushAndResetTimer: () => { cbCalled++; cache.clear(); }
  });
});

tape('EVENTS CACHE / Should call the "flushAndResetTimer" of the events module if the queue is full and the events module is present for this instance.', assert => {
  const ctx = new Context;
  ctx.put(ctx.constants.SETTINGS, {
    scheduler: {
      eventsQueueSize: 3
    }
  });
  let cbCalled = 0;
  let cache;
  // Context is ready before creating the cache.
  ctx.put(ctx.constants.EVENTS, {
    flushAndResetTimer: () => { cbCalled++; cache.clear(); }
  });
  cache = new EventsCache(ctx);

  cache.track(0);
  cache.track(1);
  assert.equal(cbCalled, 0, 'Cache still not full.');
  cache.track(2);
  assert.equal(cbCalled, 1, 'But once it is full, as the events module was ready before creating, there is no need to wait for flush.');

  assert.end();
});

tape('EVENTS CACHE / Should call the "flushAndResetTimer" of the events module if the queue is full and the events module is present for this instance.', assert => {
  const ctx = new Context;
  ctx.put(ctx.constants.SETTINGS, {
    scheduler: {
      eventsQueueSize: 3
    }
  });
  let cbCalled = 0;
  let cache;
  // Context is ready before creating the cache.
  ctx.put(ctx.constants.EVENTS, {
    wrongName: () => { cbCalled++; cache.clear(); }
  });
  cache = new EventsCache(ctx);

  cache.track(0);
  cache.track(1);
  assert.equal(cbCalled, 0, 'Cache still not full,');
  assert.doesNotThrow(cache.track.bind(cache, 2), 'but when it is full, as the events module does not have the function we need, nothing happens but no exceptions are thrown.');
  assert.doesNotThrow(cache.track.bind(cache, 3), 'but when it is full, as the events module does not have the function we need, nothing happens but no exceptions are thrown.');
  assert.equal(cbCalled, 0, 'but when it is full, as the events module does not have the function we need, nothing happens but no exceptions are thrown.');

  assert.end();
});
