import tape from 'tape';
import sinon from 'sinon';
import MySegmentsCacheInMemory from '../../../storage/SegmentCache/InMemory/browser';
import KeyBuilder from '../../../storage/Keys';
import SettingsFactory from '../../../utils/settings';

import MySegmentUpdateWorker from '../../SegmentUpdateWorker/browser';

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

    __resolveMySegmentsUpdaterCall(index, value) {
      __mySegmentsUpdaterCalls[index].res(value); // resolve previous call
    },
  };
}

tape('MySegmentUpdateWorker', t => {

  // setup
  const cache = new MySegmentsCacheInMemory(new KeyBuilder(SettingsFactory()));
  const producer = ProducerMock();

  const mySegmentUpdateWorker = new MySegmentUpdateWorker(cache, producer);
  mySegmentUpdateWorker.backoff.baseMillis = 0; // retry immediately

  t.equal(mySegmentUpdateWorker.maxChangeNumber, 0, 'inits with not queued changeNumber (maxChangeNumber equals to 0)');

  t.test('put', assert => {

    // assert calling `synchronizeMySegments` if `isSynchronizingMySegments` is false
    assert.equal(producer.isSynchronizingMySegments(), false);
    mySegmentUpdateWorker.put(100);
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 100, 'queues changeNumber if it is mayor than current maxChangeNumber');
    assert.true(producer.synchronizeMySegments.calledOnce, 'calls `synchronizeMySegments` if `isSynchronizingMySegments` is false');

    // assert queueing changeNumber if `isSynchronizingMySegments` is true
    assert.equal(producer.isSynchronizingMySegments(), true);
    mySegmentUpdateWorker.put(105);
    mySegmentUpdateWorker.put(104);
    mySegmentUpdateWorker.put(106);
    assert.true(producer.synchronizeMySegments.calledOnce, 'doesn\'t call `synchronizeMySegments` if `isSynchronizingMySegments` is true');
    assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'queues changeNumber if it is mayor than current maxChangeNumber');

    // assert calling `synchronizeMySegments` if previous call is resolved and a new changeNumber in queue
    producer.__resolveMySegmentsUpdaterCall(0); // fetch success
    setTimeout(() => {
      assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` if `isSynchronizingMySegments` is false and queue is not empty');
      assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'maxChangeNumber');
      assert.equal(mySegmentUpdateWorker.backoff.attempts, 0, 'no retry scheduled if synchronization success (changeNumbers are the expected)');

      // assert reschedule synchronization if fetch fails
      producer.__resolveMySegmentsUpdaterCall(1, false); // fetch fail
      setTimeout(() => {
        assert.equal(producer.synchronizeMySegments.callCount, 3, 'recalls `synchronizeSegment` if synchronization fail (one changeNumber is not the expected)');
        assert.equal(mySegmentUpdateWorker.backoff.attempts, 1, 'retry scheduled since synchronization failed (one changeNumber is not the expected)');

        // assert dequeueing changeNumber
        producer.__resolveMySegmentsUpdaterCall(2); // fetch success
        setTimeout(() => {
          assert.equal(producer.synchronizeMySegments.callCount, 3, 'doesn\'t call `synchronizeMySegments` while queue is empty');
          assert.equal(mySegmentUpdateWorker.maxChangeNumber, 106, 'maxChangeNumber');

          // assert handling an event with segmentList after an event without segmentList,
          // to validate the special case than the fetch associated to the first event is resolved after a second event with payload arrives
          producer.synchronizeMySegments.resetHistory();
          assert.equal(producer.isSynchronizingMySegments(), false);
          mySegmentUpdateWorker.put(110);
          assert.equal(producer.isSynchronizingMySegments(), true);
          mySegmentUpdateWorker.put(120, ['some_segment']);
          assert.true(producer.synchronizeMySegments.calledOnce, 'doesn\'t call `synchronizeMySegments` if `isSynchronizingMySegments` is true, even if payload (segmentList) is included');

          producer.__resolveMySegmentsUpdaterCall(3); // fetch success
          setTimeout(() => {
            assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` once previous event was handled');
            assert.true(producer.synchronizeMySegments.lastCall.calledWithExactly(['some_segment']), 'calls `synchronizeMySegments` with given segmentList');
            producer.__resolveMySegmentsUpdaterCall(4); // fetch success
            setTimeout(() => {
              assert.equal(mySegmentUpdateWorker.currentChangeNumber, 120, 'currentChangeNumber updated');

              // assert handling an event without segmentList after one with segmentList,
              // to validate the special case than the event-loop of a handled event with payload is run after a second event arrives
              producer.synchronizeMySegments.resetHistory();
              mySegmentUpdateWorker.put(130, ['other_segment']);
              mySegmentUpdateWorker.put(140);
              assert.true(producer.synchronizeMySegments.calledOnce, 'call `synchronizeMySegments` once, until event is handled');

              producer.__resolveMySegmentsUpdaterCall(5); // fetch success
              setTimeout(() => {
                assert.true(producer.synchronizeMySegments.calledTwice, 'recalls `synchronizeMySegments` once previous event was handled');
                assert.true(producer.synchronizeMySegments.lastCall.calledWithExactly(undefined), 'calls `synchronizeMySegments` without segmentList if the event doesn\'t have payload');
                producer.__resolveMySegmentsUpdaterCall(6); // fetch success
                setTimeout(() => {
                  assert.equal(mySegmentUpdateWorker.currentChangeNumber, 140, 'currentChangeNumber updated');

                  // assert restarting retries, when a newer event is queued
                  mySegmentUpdateWorker.put(150); // queued
                  assert.equal(mySegmentUpdateWorker.backoff.attempts, 0, 'backoff scheduler for retries is reset if a new event is queued');

                  assert.end();
                });
              });
            });
          });
        });

      }, 10); // wait a little bit until `synchronizeMySegments` is called in next event-loop cycle
    });
  });

});