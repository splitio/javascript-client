import tape from 'tape-catch';
import ImpressionCounter from '../counter';

tape('Counter / Impression Counter Test makeKey', assert => {
  const timestamp = new Date(2020, 9, 2, 10, 0, 0).getTime();
  const counter = new ImpressionCounter();

  assert.equal(counter._makeKey('someFeature', new Date(2020, 9, 2, 10, 53, 12).getTime()), `someFeature::${timestamp}`);
  assert.equal(counter._makeKey('', new Date(2020, 9, 2, 10, 53, 12).getTime()), `::${timestamp}`);
  assert.equal(counter._makeKey(null, new Date(2020, 9, 2, 10, 53, 12).getTime()), `null::${timestamp}`);
  assert.equal(counter._makeKey(null, 0), 'null::0');

  assert.end();
});

tape('Counter / Impression Counter Test BasicUsage', assert => {
  const timestamp = new Date(2020, 9, 2, 10, 10, 12).getTime();
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

  const nextHourTimestamp = new Date(2020, 9, 2, 11, 10, 12).getTime();
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
