import Redis from 'ioredis';
import tape from 'tape-catch';
import find from 'lodash/find';
import isEqual from 'lodash/isEqual';
import KeyBuilder from '../../../Keys';
import EventsCacheInRedis from '../../../EventsCache/InRedis';
import SettingsFactory from '../../../../utils/settings';
const settings = SettingsFactory({
  storage: {
    type: 'REDIS',
    prefix: 'UT_EVENTS_CACHE_PREFIX'
  }
});

tape('EVENTS CACHE IN REDIS / should incrementally store values in redis', async function(assert) {
  const connection = new Redis(settings.storage.options);
  // This piece is being tested elsewhere.
  const keys = new KeyBuilder(settings);
  const key = keys.buildEventsKey();

  const fakeMeta = { s: 'js_someversion', i: 'some_ip', n: 'some_hostname' };
  const fakeEvent1 = { event: 1 };
  const fakeEvent2 = { event: '2' };
  const fakeEvent3 = { event: null };

  // Clean up in case there are still keys there.
  connection.del(key);

  let redisValues = await connection.lrange(key, 0, -1);

  assert.equal(redisValues.length, 0, 'control assertion, there are no events previously queued.');

  const cache = new EventsCacheInRedis(keys, connection, fakeMeta);

  await cache.track(fakeEvent1);
  await cache.track(fakeEvent2);
  await cache.track(fakeEvent3);

  redisValues = await connection.lrange(key, 0, -1);

  assert.equal(redisValues.length, 3, 'After pushing we should have on Redis as many events as we have stored.');
  assert.equal(typeof redisValues[0], 'string', 'All elements should be strings since those are stringified JSONs.');
  assert.equal(typeof redisValues[1], 'string', 'All elements should be strings since those are stringified JSONs.');
  assert.equal(typeof redisValues[2], 'string', 'All elements should be strings since those are stringified JSONs.');

  const findMatchingElem = event => {
    return find(redisValues, elem => {
      const parsedElem = JSON.parse(elem);
      return isEqual(parsedElem.e, event) && isEqual(parsedElem.m, fakeMeta);
    });
  };

  /* If the elements are found, then the values are correct. */
  const foundEv1 = findMatchingElem(fakeEvent1);
  const foundEv2 = findMatchingElem(fakeEvent2);
  const foundEv3 = findMatchingElem(fakeEvent3);
  assert.true(foundEv1, 'Events stored on redis matched the values we are expecting.');
  assert.true(foundEv2, 'Events stored on redis matched the values we are expecting.');
  assert.true(foundEv3, 'Events stored on redis matched the values we are expecting.');

  // Clean up then end.
  await connection.del(key);
  await connection.quit();
  assert.end();
});
