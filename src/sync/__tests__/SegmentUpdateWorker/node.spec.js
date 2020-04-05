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

  let __isSegmentsUpdaterRunning = false;

  function isSegmentsUpdaterRunning() {
    return __isSegmentsUpdaterRunning;
  }

  function callSegmentsUpdater() {
    __isSegmentsUpdaterRunning = true;
    return __segmentsUpdater().finally(function () {
      __isSegmentsUpdaterRunning = false;
    });
  }

  return {
    isSegmentsUpdaterRunning: sinon.spy(isSegmentsUpdaterRunning),
    callSegmentsUpdater: sinon.spy(callSegmentsUpdater),

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

    // assert calling to callSegmentsUpdater if isSegmentsUpdaterRunning is false
    assert.equal(producer.isSegmentsUpdaterRunning(), false);
    segmentUpdateWorker.put('mocked_segment_1', 100);
    assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 1, 'queues event');
    assert.true(producer.callSegmentsUpdater.calledOnce, 'calls `callSegmentsUpdater` if isSegmentsUpdaterRunning is false');
    assert.true(producer.callSegmentsUpdater.calledOnceWithExactly(['mocked_segment_1']), 'calls `callSegmentsUpdater` with segmentName');

    // assert queueing items if isSegmentsUpdaterRunning is true
    assert.equal(producer.isSegmentsUpdaterRunning(), true);
    segmentUpdateWorker.put('mocked_segment_1', 95);
    segmentUpdateWorker.put('mocked_segment_2', 100);

    assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 3, 'queues events');
    assert.true(producer.callSegmentsUpdater.calledOnce, 'doesn\'t call `callSegmentsUpdater` while isSegmentsUpdaterRunning is true');

    // assert dequeueing and recalling to `callSegmentsUpdater`
    producer.__resolveSegmentsUpdaterCall(0, 'mocked_segment_1', 100); // resolve first call to `callSegmentsUpdater`
    setTimeout(() => {
      assert.equal(cache.getChangeNumber('mocked_segment_1'), 100, '100');
      assert.true(producer.callSegmentsUpdater.calledTwice, 'recalls `callSegmentsUpdater` if isSegmentsUpdaterRunning is false and queue is not empty');
      assert.true(producer.callSegmentsUpdater.lastCall.calledWithExactly(['mocked_segment_2']), 'calls `callSegmentsUpdater` with segmentName');

      // assert dequeueing remaining events
      producer.__resolveSegmentsUpdaterCall(1, 'mocked_segment_2', 100); // resolve second call to `callSegmentsUpdater`
      setTimeout(() => {
        assert.true(producer.callSegmentsUpdater.calledTwice, 'doesn\'t call `callSegmentsUpdater` for an event with old `changeNumber` (\'mocked_segment_1\', 95)');
        assert.equal(segmentUpdateWorker.segmentsChangesQueue.length, 0, 'dequeues events');

        assert.end();
      });
    });
  });

});