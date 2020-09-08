import tape from 'tape-catch';
import BrowserImpressionObserver from '../browser';

const generateImpressions = count => {
  const impressions = [];
  for (let i = 0; i < count; i++) {
    impressions.push({
      keyName: `key_${i}`,
      feature: `feature_${i % 10}`,
      label: (i % 2 === 0) ? 'in segment all' : 'whitelisted',
      changeNumber: i * i,
      time: Date.now()
    });
  }
  return impressions;
};

tape('Browser JS / Impression Observer Basic Functionality', assert => {
  const observer = BrowserImpressionObserver().impressionObserver;

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

  assert.is(observer.testAndSet(imp), null);
  assert.equal(observer.testAndSet(imp), imp.time);

  assert.end();
});
