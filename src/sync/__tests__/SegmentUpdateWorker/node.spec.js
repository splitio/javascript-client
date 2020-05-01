import tape from 'tape';
import sinon from 'sinon';
import SegmentCacheInMemory from '../../../storage/SegmentCache/InMemory/node';
import KeyBuilder from '../../../storage/Keys';
import SettingsFactory from '../../../utils/settings';

import SegmentUpdateWorker from '../../SegmentUpdateWorker/SegmentUpdateWorker';

function ProducerMock(segmentStorage) {

  const __segmentsUpdaterCalls = [];

  function __segmentsUpdater() {
    return new Promise((res, rej) => { __segmentsUpdaterCalls.push({ res, rej }); });
  }

  let __isSynchronizingSegments = false;

  function isSynchronizingSegments() {
    return __isSynchronizingSegments;
  }

  function synchronizeSegment() {
    __isSynchronizingSegments = true;
    return __segmentsUpdater().finally(function () {
      __isSynchronizingSegments = false;
    });
  }

  return {
    isSynchronizingSegments: sinon.spy(isSynchronizingSegments),
    synchronizeSegment: sinon.spy(synchronizeSegment),

    __resolveSegmentsUpdaterCall(index, changeNumbers) {
      Object.keys(changeNumbers).forEach(segmentName => {
        segmentStorage.setChangeNumber(segmentName, changeNumbers[segmentName]); // update changeNumber in storage
      });
      __segmentsUpdaterCalls[index].res(); // resolve previous call
    },
  };
}

tape('SegmentUpdateWorker', t => {

  // setup
  const cache = new SegmentCacheInMemory(new KeyBuilder(SettingsFactory()));
  cache.addToSegment('mocked_segment_1', ['a', 'b', 'c']);
  cache.addToSegment('mocked_segment_2', ['d']);
  cache.addToSegment('mocked_segment_3', ['e']);
  const producer = ProducerMock(cache);

  const segmentUpdateWorker = new SegmentUpdateWorker(cache, producer);
  segmentUpdateWorker.backoff.baseMillis = 0; // retry immediately

  t.deepEqual(segmentUpdateWorker.maxChangeNumbers, {}, 'inits with not queued events');

  t.test('put', assert => {

    // assert calling `synchronizeSegment` if `isSynchronizingSegments` is false
    assert.equal(producer.isSynchronizingSegments(), false);
    segmentUpdateWorker.put(100, 'mocked_segment_1');
    assert.deepEqual(segmentUpdateWorker.maxChangeNumbers, { 'mocked_segment_1': 100 }, 'queues events (changeNumbers) if they are mayor than storage changeNumbers and maxChangeNumbers');
    assert.true(producer.synchronizeSegment.calledOnce, 'calls `synchronizeSegment` if `isSynchronizingSegments` is false');
    assert.true(producer.synchronizeSegment.calledOnceWithExactly(['mocked_segment_1']), 'calls `synchronizeSegment` with segmentName');

    // assert queueing items if `isSynchronizingSegments` is true
    assert.equal(producer.isSynchronizingSegments(), true);
    segmentUpdateWorker.put(95, 'mocked_segment_1');
    segmentUpdateWorker.put(100, 'mocked_segment_2');
    segmentUpdateWorker.put(105, 'mocked_segment_1');
    segmentUpdateWorker.put(94, 'mocked_segment_1');
    segmentUpdateWorker.put(94, 'mocked_segment_3');

    assert.deepEqual(segmentUpdateWorker.maxChangeNumbers, { 'mocked_segment_1': 105, 'mocked_segment_2': 100, 'mocked_segment_3': 94 }, 'queues events');
    assert.true(producer.synchronizeSegment.calledOnce, 'doesn\'t call `synchronizeSegment` if `isSynchronizingSegments` is true');

    // assert dequeueing and recalling to `synchronizeSegment`
    producer.__resolveSegmentsUpdaterCall(0, { 'mocked_segment_1': 100 }); // resolve first call to `synchronizeSegment`
    setTimeout(() => {
      assert.equal(cache.getChangeNumber('mocked_segment_1'), 100, '100');
      assert.true(producer.synchronizeSegment.calledTwice, 'recalls `synchronizeSegment` if `isSynchronizingSegments` is false and queue is not empty');
      assert.true(producer.synchronizeSegment.lastCall.calledWithExactly(['mocked_segment_1', 'mocked_segment_2', 'mocked_segment_3']), 'calls `synchronizeSegment` with segmentName');
      assert.equal(segmentUpdateWorker.backoff.attempts, 0, 'no retry scheduled if synchronization success (changeNumbers are the expected)');

      // assert reschedule synchronization if some changeNumber is not updated as expected
      producer.__resolveSegmentsUpdaterCall(1, { 'mocked_segment_1': 100, 'mocked_segment_2': 100, 'mocked_segment_3': 94 });
      setTimeout(() => {
        assert.equal(producer.synchronizeSegment.callCount, 3, 'recalls `synchronizeSegment` if synchronization fail (one changeNumber is not the expected)');
        assert.true(producer.synchronizeSegment.lastCall.calledWithExactly(['mocked_segment_1']), 'calls `synchronizeSegment` with the segmentName that failed to fetch');
        assert.equal(segmentUpdateWorker.backoff.attempts, 1, 'retry scheduled since synchronization failed (one changeNumber is not the expected)');

        // assert dequeueing remaining events
        producer.__resolveSegmentsUpdaterCall(1, { 'mocked_segment_1': 105 }); // resolve third call to `synchronizeSegment`
        setTimeout(() => {
          assert.equal(producer.synchronizeSegment.callCount, 3, 'doesn\'t call `synchronizeSegment` again');
          assert.deepEqual(segmentUpdateWorker.maxChangeNumbers, { 'mocked_segment_1': 105, 'mocked_segment_2': 100, 'mocked_segment_3': 94 }, 'maxChangeNumbers');

          // assert restarting retries, when a newer event is queued
          segmentUpdateWorker.put(110, 'mocked_segment_1'); // queued
          assert.equal(segmentUpdateWorker.backoff.attempts, 0, 'backoff scheduler for retries is reset if a new event is queued');

          assert.end();
        });

      }, 10); // wait a little bit until `synchronizeSegment` is called in next event-loop cycle
    });
  });

});