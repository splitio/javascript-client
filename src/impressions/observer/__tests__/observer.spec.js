import tape from 'tape-catch';
import ImpressionObserver from '../observer';
import hasher from '../../hasher';
import { generateImpressions } from './testUtils';

tape('Murmur 128 / Impression Observer Basic Functionality', assert => {
  const observer = new ImpressionObserver(5, hasher.hashImpression128);

  const imp = {
    keyName: 'someKey',
    feature: 'someFeature',
    label: 'in segment all',
    changeNumber: 123,
    time: Date.now(),
  };

  // Add 5 new impressions so that the old one is evicted and re-try the test.
  generateImpressions(5).forEach(ki => {
    observer.testAndSet(ki);
  });

  assert.is(observer.testAndSet(imp), undefined);
  assert.equal(observer.testAndSet(imp), imp.time);

  assert.end();
});

tape('Murmur 128 / Impression Observer Max Size', assert => {
  const observer = new ImpressionObserver(100, hasher.hashImpression128);

  const impressions = generateImpressions(200);

  for (let i = 0; i < 100; i++) {
    observer.testAndSet(impressions[i]);
  }
  assert.equal(observer.cache.length, 100);

  for (let i = 100; i < 200; i++) {
    observer.testAndSet(impressions[i]);
  }
  assert.equal(observer.cache.length, 100);

  assert.end();
});

tape('Murmur 32 / Impression Observer Basic Functionality', assert => {
  const observer = new ImpressionObserver(5, hasher.hashImpression32);

  const imp = {
    keyName: 'someKey',
    feature: 'someFeature',
    label: 'in segment all',
    changeNumber: 123,
    time: Date.now(),
  };

  // Add 5 new impressions so that the old one is evicted and re-try the test.
  generateImpressions(5).forEach(ki => {
    observer.testAndSet(ki);
  });

  assert.is(observer.testAndSet(imp), undefined);
  assert.equal(observer.testAndSet(imp), imp.time);

  assert.end();
});

tape('Murmur 32 / Impression Observer Max Size', assert => {
  const observer = new ImpressionObserver(100, hasher.hashImpression32);

  const impressions = generateImpressions(200);

  for (let i = 0; i < 100; i++) {
    observer.testAndSet(impressions[i]);
  }
  assert.equal(observer.cache.length, 100);

  for (let i = 100; i < 200; i++) {
    observer.testAndSet(impressions[i]);
  }
  assert.equal(observer.cache.length, 100);

  assert.end();
});
