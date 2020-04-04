import tape from 'tape';
import sinon from 'sinon';
import MySegmentsCacheInMemory from '../../../storage/SegmentCache/InMemory/browser';
import KeyBuilder from '../../../storage/Keys';
import SettingsFactory from '../../../utils/settings';

import MySegmentSync from '../../SegmentSync/MySegmentSync';

function ProducerMock() {

  const __mySegmentsUpdaterCalls = [];

  function __segmentsUpdater() {
    return new Promise((res, rej) => { __mySegmentsUpdaterCalls.push({ res, rej }); });
  }

  let __isMySegmentsUpdaterRunning = false;

  function isMySegmentsUpdaterRunning() {
    return __isMySegmentsUpdaterRunning;
  }

  function callMySegmentsUpdater() {
    __isMySegmentsUpdaterRunning = true;
    return __segmentsUpdater().finally(function () {
      __isMySegmentsUpdaterRunning = false;
    });
  }

  return {
    isMySegmentsUpdaterRunning: sinon.spy(isMySegmentsUpdaterRunning),
    callMySegmentsUpdater: sinon.spy(callMySegmentsUpdater),

    __resolveMySegmentsUpdaterCall(index) {
      __mySegmentsUpdaterCalls[index].res(); // resolve previous call
    },
  };
}

tape('MySegmentSync', t => {

  t.test('queueSyncMySegments', assert => {

    // setup
    const cache = new MySegmentsCacheInMemory(new KeyBuilder(SettingsFactory()));
    const producer = ProducerMock();

    const mySegmentSync = new MySegmentSync(cache, producer);
    assert.equal(mySegmentSync.maxChangeNumber, 0, 'inits with not queued changeNumber (maxChangeNumber equals to 0)');

    // assert calling to callSplitsUpdater if isSplitsUpdaterRunning is false
    assert.equal(producer.isMySegmentsUpdaterRunning(), false);
    mySegmentSync.queueSyncMySegments(100);
    assert.equal(mySegmentSync.maxChangeNumber, 100, 'queues changeNumber if it is mayor than currentChangeNumber and queue is empty');
    assert.true(producer.callMySegmentsUpdater.calledOnce, 'calls `callMySegmentsUpdater` if isMySegmentsUpdaterRunning is false');

    // assert queueing changeNumber if isSplitsUpdaterRunning is true
    assert.equal(producer.isMySegmentsUpdaterRunning(), true);
    mySegmentSync.queueSyncMySegments(105);
    mySegmentSync.queueSyncMySegments(104);
    mySegmentSync.queueSyncMySegments(106);
    assert.true(producer.callMySegmentsUpdater.calledOnce, 'doesn\'t call `callMySegmentsUpdater` while isMySegmentsUpdaterRunning is true');
    assert.equal(mySegmentSync.maxChangeNumber, 106, 'queues changeNumber if it is mayor than max queued changeNumber and currentChangeNumber');

    // assert calling to callSplitsUpdater if previous call is resolved and a new changeNumber in queue
    producer.__resolveMySegmentsUpdaterCall(0);
    setTimeout(() => {
      assert.true(producer.callMySegmentsUpdater.calledTwice, 'recalls `callMySegmentsUpdater` if isMySegmentsUpdaterRunning is false and queue is not empty');
      assert.equal(mySegmentSync.maxChangeNumber, 106, 'changeNumber stays queued until `callMySegmentsUpdater` is settled');

      // assert dequeueing changeNumber
      producer.__resolveMySegmentsUpdaterCall(1);
      setTimeout(() => {
        assert.true(producer.callMySegmentsUpdater.calledTwice, 'doesn\'t call `callMySegmentsUpdater` while queues is empty');
        assert.equal(mySegmentSync.maxChangeNumber, 0, 'dequeues changeNumber once `callMySegmentsUpdater` is resolved');

        // assert call with segmentList after a call without segmentList
        producer.callMySegmentsUpdater.resetHistory();
        assert.equal(producer.isMySegmentsUpdaterRunning(), false);
        mySegmentSync.queueSyncMySegments(110);
        assert.equal(producer.isMySegmentsUpdaterRunning(), true);
        mySegmentSync.queueSyncMySegments(120, ['some_segment']);
        assert.true(producer.callMySegmentsUpdater.calledTwice, 'calls `callMySegmentsUpdater` even if it is running, if segmentList is present and changeNumber is mayor than current one');
        assert.true(producer.callMySegmentsUpdater.lastCall.calledWithExactly(['some_segment']), 'calls `callMySegmentsUpdater` with given segmentList');

        // assert not queued call
        mySegmentSync.queueSyncMySegments(115);
        assert.true(producer.callMySegmentsUpdater.calledTwice, 'doesn\'t call');

        producer.__resolveMySegmentsUpdaterCall(2);
        producer.__resolveMySegmentsUpdaterCall(3);
        setTimeout(() => {
          assert.equal(mySegmentSync.currentChangeNumber, 120, 'currentChangeNumber updated');
          assert.end();
        });
      });
    });
  });

});