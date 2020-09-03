import tape from 'tape-catch';
import hasher from '../hasher';
import ImpressionObserver from '../observer';
import ImpressionCounter from '../counter';

tape('Node JS / Impression Hasher Works', assert => {
  const imp1 = {
    feature: 'someFeature',
    keyName: 'someKey',
    changeNumber: 123,
    label: 'someLabel',
    treatment: 'someTreatment',
  };

  // Same Impression
  const imp2 = {
    feature: 'someFeature',
    keyName: 'someKey',
    changeNumber: 123,
    label: 'someLabel',
    treatment: 'someTreatment',
  };
  assert.equal(hasher(imp1), hasher(imp2));

  // Different feature
  imp2.feature = 'someOtherFeature';
  assert.notEqual(hasher(imp1), hasher(imp2));

  // Different key
  imp2.feature = imp1.feature;
  imp2.keyName = 'someOtherKey';
  assert.notEqual(hasher(imp1), hasher(imp2));

  // Different changeNumber
  imp2.keyName = imp1.keyName;
  imp2.changeNumber = 456;
  assert.notEqual(hasher(imp1), hasher(imp2));

  // Different label
  imp2.changeNumber = imp1.changeNumber;
  imp2.label = 'someOtherLabel';
  assert.notEqual(hasher(imp1), hasher(imp2));

  // Different Treatment
  imp2.label = imp1.label;
  imp2.treatment = 'someOtherTreatment';
  assert.notEqual(hasher(imp1), hasher(imp2));

  assert.end();
});

tape('Node JS / Impression Hasher Does Not Crash', assert => {
  const imp1 = {
    feature: 'someFeature',
    keyName: 'someKey',
    changeNumber: 123,
    label: 'someLabel',
    treatment: 'someTreatment',
  };

  imp1.keyName = null;
  assert.isNot(hasher(imp1), null);

  imp1.changeNumber = null;
  assert.isNot(hasher(imp1), null);

  imp1.label = null;
  assert.isNot(hasher(imp1), null);

  imp1.treatment = null;
  assert.isNot(hasher(imp1), null);

  assert.is(hasher(null), null);

  assert.end();
});

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

tape('Node JS / Impression Observer Basic Functionality', assert => {
  const observer = new ImpressionObserver(5);

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

tape('Node JS / Impression Observer Max Size', assert => {
  const observer = new ImpressionObserver(100);

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

tape('Node JS / Impression Counter Test truncateTimeFrame', assert => {
  const counter = new ImpressionCounter();

  assert.equal(counter._truncateTimeFrame(new Date(2020, 9, 2, 10, 53, 12).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(counter._truncateTimeFrame(new Date(2020, 9, 2, 10, 0, 0).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(counter._truncateTimeFrame(new Date(2020, 9, 2, 10, 53, 0).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(counter._truncateTimeFrame(new Date(2020, 9, 2, 10, 0, 12).getTime()), new Date(2020, 9, 2, 10, 0, 0).getTime());
  assert.equal(counter._truncateTimeFrame(new Date(1970, 1, 0, 0, 0, 0).getTime()), new Date(1970, 1, 0, 0, 0, 0).getTime());

  assert.end();
});

tape('Node JS / Impression Counter Test makeKey', assert => {
  const timestamp = new Date(2020, 9, 2, 10, 0 , 0).getTime();
  const counter = new ImpressionCounter();

  assert.equal(counter._makeKey('someFeature', new Date(2020, 9, 2, 10, 53, 12).getTime()), `someFeature::${timestamp}`);
  assert.equal(counter._makeKey('', new Date(2020, 9, 2, 10, 53, 12).getTime()), `::${timestamp}`);
  assert.equal(counter._makeKey(null, new Date(2020, 9, 2, 10, 53, 12).getTime()), `null::${timestamp}`);
  assert.equal(counter._makeKey(null, 0), 'null::0');

  assert.end();
});

tape('Node JS / Impression Counter Test BasicUsage', assert => {
  const timestamp = new Date(2020, 9, 2, 10, 10 , 12).getTime();
  const counter = new ImpressionCounter();
  counter.inc('feature1', timestamp, 1);
  counter.inc('feature1', timestamp + 1, 1);
  counter.inc('feature1', timestamp + 2, 1);
  counter.inc('feature2', timestamp + 3, 2);
  counter.inc('feature2', timestamp + 4, 2);

  const counted = counter.popAll();
  assert.equal(Object.keys(counted).length, 2);
  assert.equal(counted[counter._makeKey('feature1', timestamp)], 3);
  assert.equal(counted[counter._makeKey('feature2', timestamp)], 4);
  assert.equal(Object.keys(counter.popAll()).length, 0);


  const nextHourTimestamp = new Date(2020, 9, 2, 11, 10 , 12).getTime();
  counter.inc('feature1', timestamp, 1);
  counter.inc('feature1', timestamp + 1, 1);
  counter.inc('feature1', timestamp + 2, 1);
  counter.inc('feature2', timestamp + 3, 2);
  counter.inc('feature2', timestamp + 4, 2);
  counter.inc('feature1', nextHourTimestamp, 1);
  counter.inc('feature1', nextHourTimestamp + 1, 1);
  counter.inc('feature1', nextHourTimestamp + 2, 1);
  counter.inc('feature2', nextHourTimestamp + 3, 2);
  counter.inc('feature2', nextHourTimestamp + 4, 2);
  const counted2 = counter.popAll();
  assert.equal(Object.keys(counted2).length, 4);
  assert.equal(counted2[counter._makeKey('feature1', timestamp)], 3);
  assert.equal(counted2[counter._makeKey('feature2', timestamp)], 4);
  assert.equal(counted2[counter._makeKey('feature1', nextHourTimestamp)], 3);
  assert.equal(counted2[counter._makeKey('feature2', nextHourTimestamp)], 4);
  assert.equal(Object.keys(counter.popAll()).length, 0);

  assert.end();
});
