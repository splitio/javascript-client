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

  // setup
  const cache = new MySegmentsCacheInMemory(new KeyBuilder(SettingsFactory()));
  const producer = ProducerMock();

  const mySegmentUpdateWorker = new MySegmentUpdateWorker(cache, producer);
  t.equal(mySegmentUpdateWorker.maxChangeNumber, 0, 'inits with not queued changeNumber (maxChangeNumber equals to 0)');

  t.test('put', assert => {

    // assert calling `synchronizeMySegments` if `isSynchronizingMySegments` is false
    assert.equal(producer.isSynchronizingMySegments(), false);
    mySegmentUpdateWorker.put(100);
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 100, 'queues changeNumber if it is mayor than currentChangeNumber and queue is empty');
    assert.true(producer.synchronizeMySegments.calledOnce, 'calls `synchronizeMySegments` if `isSynchronizingMySegments` is false');

    // assert queueing changeNumber if `isSynchronizingMySegments` is true
    assert.equal(producer.isSynchronizingMySegments(), true);
    mySegmentUpdateWorker.put(105);
    mySegmentUpdateWorker.put(104);
    mySegmentUpdateWorker.put(106);
    assert.true(producer.synchronizeMySegments.calledOnce, 'doesn\'t call `synchronizeMySegments` if `isSynchronizingMySegments` is true');
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'queues changeNumber if it is mayor than max queued changeNumber and currentChangeNumber');

    // assert calling `synchronizeMySegments` if previous call is resolved and a new changeNumber in queue
    producer.__resolveMySegmentsUpdaterCall(0);
    setTimeout(() => {
      assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` if `isSynchronizingMySegments` is false and queue is not empty');
      assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'changeNumber stays queued until `synchronizeMySegments` is settled');

      // assert dequeueing changeNumber
      producer.__resolveMySegmentsUpdaterCall(1);
      setTimeout(() => {
        assert.true(producer.synchronizeMySegments.calledTwice, 'doesn\'t call `synchronizeMySegments` while queue is empty');
        assert.equal(mySegmentUpdateWorker.maxChangeNumber, 0, 'dequeues changeNumber once `synchronizeMySegments` is resolved');

        // assert handling an event with segmentList after an event without segmentList,
        // to validate the special case than the fetch associated to the first event is resolved after a second event with payload arrives
        producer.synchronizeMySegments.resetHistory();
        assert.equal(producer.isSynchronizingMySegments(), false);
        mySegmentUpdateWorker.put(110);
        assert.equal(producer.isSynchronizingMySegments(), true);
        mySegmentUpdateWorker.put(120, ['some_segment']);
        assert.true(producer.synchronizeMySegments.calledOnce, 'doesn\'t call `synchronizeMySegments` if `isSynchronizingMySegments` is true, even if payload (segmentList) is included');

        producer.__resolveMySegmentsUpdaterCall(2);
        setTimeout(() => {
          assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` once previous event was handled');
          assert.true(producer.synchronizeMySegments.lastCall.calledWithExactly(['some_segment']), 'calls `synchronizeMySegments` with given segmentList');
          producer.__resolveMySegmentsUpdaterCall(3);
          setTimeout(() => {
            assert.equal(mySegmentUpdateWorker.currentChangeNumber, 120, 'currentChangeNumber updated');

            // assert handling an event without segmentList after one with segmentList,
            // to validate the special case than the event-loop of a handled event with payload is run after a second event arrives
            producer.synchronizeMySegments.resetHistory();
            mySegmentUpdateWorker.put(130, ['other_segment']);
            mySegmentUpdateWorker.put(140);
            assert.true(producer.synchronizeMySegments.calledOnce, 'call `synchronizeMySegments` once, until event is handled');

            producer.__resolveMySegmentsUpdaterCall(4);
            setTimeout(() => {
              assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` once previous event was handled');
              assert.true(producer.synchronizeMySegments.lastCall.calledWithExactly(undefined), 'calls `synchronizeMySegments` without segmentList if the event doesn\'t have payload');
              producer.__resolveMySegmentsUpdaterCall(5);
              setTimeout(() => {
                assert.equal(mySegmentUpdateWorker.currentChangeNumber, 140, 'currentChangeNumber updated');
                assert.end();
              });
            });
          });
        });
      });
    });
  });

});