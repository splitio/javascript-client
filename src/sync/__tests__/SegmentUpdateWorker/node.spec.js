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

    __resolveSegmentsUpdaterCall(index, segmentName, changeNumber) {
      segmentStorage.setChangeNumber(segmentName, changeNumber); // update changeNumber in storage
      __segmentsUpdaterCalls[index].res(); // resolve previous call
    },
  };
}

tape('SegmentUpdateWorker', t => {

  t.test('put', assert => {

    // setup
    const cache = new SegmentCacheInMemory(new KeyBuilder(SettingsFactory()));
    cache.addToSegment('mocked_segment_1', ['a', 'b', 'c']);
    cache.addToSegment('mocked_segment_2', ['d']);
    const producer = ProducerMock(cache);

    const segmentUpdateWorker = new SegmentUpdateWorker(cache, producer);
    assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 0, 'inits with not queued events');

    // assert calling to `synchronizeSegment` if `isSynchronizingSegments` is false
    assert.equal(producer.isSynchronizingSegments(), false);
    segmentUpdateWorker.put(100, 'mocked_segment_1');
    assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 1, 'queues event');
    assert.true(producer.synchronizeSegment.calledOnce, 'calls `synchronizeSegment` if `isSynchronizingSegments` is false');
    assert.true(producer.synchronizeSegment.calledOnceWithExactly('mocked_segment_1'), 'calls `synchronizeSegment` with segmentName');

    // assert queueing items if `isSynchronizingSegments` is true
    assert.equal(producer.isSynchronizingSegments(), true);
    segmentUpdateWorker.put(95, 'mocked_segment_1');
    segmentUpdateWorker.put(100, 'mocked_segment_2');

    assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 3, 'queues events');
    assert.true(producer.synchronizeSegment.calledOnce, 'doesn\'t call `synchronizeSegment` while isSynchronizingSegments is true');

    // assert dequeueing and recalling to `synchronizeSegment`
    producer.__resolveSegmentsUpdaterCall(0, 'mocked_segment_1', 100); // resolve first call to `synchronizeSegment`
    setTimeout(() => {
      assert.equal(cache.getChangeNumber('mocked_segment_1'), 100, '100');
      assert.true(producer.synchronizeSegment.calledTwice, 'recalls `synchronizeSegment` if `isSynchronizingSegments` is false and queue is not empty');
      assert.true(producer.synchronizeSegment.lastCall.calledWithExactly('mocked_segment_2'), 'calls `synchronizeSegment` with segmentName');

      // assert dequeueing remaining events
      producer.__resolveSegmentsUpdaterCall(1, 'mocked_segment_2', 100); // resolve second call to `synchronizeSegment`
      setTimeout(() => {
        assert.true(producer.synchronizeSegment.calledTwice, 'doesn\'t call `synchronizeSegment` for an event with old `changeNumber` (\'mocked_segment_1\', 95)');
        assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 0, 'dequeues events');

        assert.end();
      });
    });
  });

});