import tape from 'tape';
import sinon from 'sinon';
import MySegmentsCacheInMemory from '../../../storage/SegmentCache/InMemory/browser';
import KeyBuilder from '../../../storage/Keys';
import SettingsFactory from '../../../utils/settings';

import MySegmentUpdateWorker from '../../SegmentUpdateWorker/MySegmentUpdateWorker';

function ProducerMock() {

  const __mySegmentsUpdaterCalls = [];

  function __segmentsUpdater() {
    return new Promise((res, rej) => { __mySegmentsUpdaterCalls.push({ res, rej }); });
  }

  let __isSynchronizingMySegments = false;

  function isSynchronizingMySegments() {
    return __isSynchronizingMySegments;
  }

  function synchronizeMySegments() {
    __isSynchronizingMySegments = true;
    return __segmentsUpdater().finally(function () {
      __isSynchronizingMySegments = false;
    });
  }

  return {
    isSynchronizingMySegments: sinon.spy(isSynchronizingMySegments),
    synchronizeMySegments: sinon.spy(synchronizeMySegments),

    __resolveMySegmentsUpdaterCall(index) {
      __mySegmentsUpdaterCalls[index].res(); // resolve previous call
    },
  };
}

tape('MySegmentUpdateWorker', t => {

  t.test('put', assert => {

    // setup
    const cache = new MySegmentsCacheInMemory(new KeyBuilder(SettingsFactory()));
    const producer = ProducerMock();

    const mySegmentUpdateWorker = new MySegmentUpdateWorker(cache, producer);
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 0, 'inits with not queued changeNumber (maxChangeNumber equals to 0)');

    // assert calling to `synchronizeSplits` if `isSynchronizingSplits` is false
    assert.equal(producer.isSynchronizingMySegments(), false);
    mySegmentUpdateWorker.put(100);
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 100, 'queues changeNumber if it is mayor than currentChangeNumber and queue is empty');
    assert.true(producer.synchronizeMySegments.calledOnce, 'calls `synchronizeMySegments` if `isSynchronizingMySegments` is false');

    // assert queueing changeNumber if `isSynchronizingSplits` is true
    assert.equal(producer.isSynchronizingMySegments(), true);
    mySegmentUpdateWorker.put(105);
    mySegmentUpdateWorker.put(104);
    mySegmentUpdateWorker.put(106);
    assert.true(producer.synchronizeMySegments.calledOnce, 'doesn\'t call `synchronizeMySegments` while isSynchronizingMySegments is true');
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'queues changeNumber if it is mayor than max queued changeNumber and currentChangeNumber');

    // assert calling to `synchronizeSplits` if previous call is resolved and a new changeNumber in queue
    producer.__resolveMySegmentsUpdaterCall(0);
    setTimeout(() => {
      assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` if `isSynchronizingMySegments` is false and queue is not empty');
      assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'changeNumber stays queued until `synchronizeMySegments` is settled');

      // assert dequeueing changeNumber
      producer.__resolveMySegmentsUpdaterCall(1);
      setTimeout(() => {
        assert.true(producer.synchronizeMySegments.calledTwice, 'doesn\'t call `synchronizeMySegments` while queues is empty');
        assert.equal(mySegmentUpdateWorker.maxChangeNumber, 0, 'dequeues changeNumber once `synchronizeMySegments` is resolved');

        // assert call with segmentList after a call without segmentList
        producer.synchronizeMySegments.resetHistory();
        assert.equal(producer.isSynchronizingMySegments(), false);
        mySegmentUpdateWorker.put(110);
        assert.equal(producer.isSynchronizingMySegments(), true);
        mySegmentUpdateWorker.put(120, ['some_segment']);
        assert.true(producer.synchronizeMySegments.calledTwice, 'calls `synchronizeMySegments` even if it is running, if segmentList is present and changeNumber is mayor than current one');
        assert.true(producer.synchronizeMySegments.lastCall.calledWithExactly(['some_segment']), 'calls `synchronizeMySegments` with given segmentList');

        // assert not queued call
        mySegmentUpdateWorker.put(115);
        assert.true(producer.synchronizeMySegments.calledTwice, 'doesn\'t call');

        producer.__resolveMySegmentsUpdaterCall(2);
        producer.__resolveMySegmentsUpdaterCall(3);
        setTimeout(() => {
          assert.equal(mySegmentUpdateWorker.currentChangeNumber, 120, 'currentChangeNumber updated');
          assert.end();
        });
      });
    });
  });

});