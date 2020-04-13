import tape from 'tape';
import sinon from 'sinon';
import SplitCacheInMemory from '../../../storage/SplitCache/InMemory';
import SplitUpdateWorker from '../../SplitUpdateWorker';

function ProducerMock(splitStorage) {

  const __splitsUpdaterCalls = [];

  function __splitsUpdater() {
    return new Promise((res, rej) => { __splitsUpdaterCalls.push({ res, rej }); });
  }

  let __isSynchronizingSplits = false;

  function isSynchronizingSplits() {
    return __isSynchronizingSplits;
  }

  function synchronizeSplits() {
    __isSynchronizingSplits = true;
    return __splitsUpdater().then(function () {
    }).finally(function () {
      __isSynchronizingSplits = false;
    });
  }

  return {
    isSynchronizingSplits: sinon.spy(isSynchronizingSplits),
    synchronizeSplits: sinon.spy(synchronizeSplits),

    __resolveSplitsUpdaterCall(index, changeNumber) {
      splitStorage.setChangeNumber(changeNumber); // update changeNumber in storage
      __splitsUpdaterCalls[index].res(); // resolve previous call
    },
  };
}

function assertKilledSplit(assert, cache, changeNumber, splitName, defaultTreatment) {
  const split = JSON.parse(cache.getSplit(splitName));
  assert.equal(split.killed, true, 'split must be killed');
  assert.equal(split.defaultTreatment, defaultTreatment, 'split must have the given default treatment');
  assert.equal(split.changeNumber, changeNumber, 'split must have the given change number');
}

tape('SplitUpdateWorker', t => {

  t.test('put', assert => {

    // setup
    const cache = new SplitCacheInMemory();
    const producer = ProducerMock(cache);

    const splitUpdateWorker = new SplitUpdateWorker(cache, producer);
    assert.equal(splitUpdateWorker.maxChangeNumber, 0, 'inits with not queued changeNumber (maxChangeNumber equals to 0)');

    // assert calling to `synchronizeSplits` if `isSynchronizingSplits` is false
    assert.equal(producer.isSynchronizingSplits(), false);
    splitUpdateWorker.put(100);
    assert.equal(splitUpdateWorker.maxChangeNumber, 100, 'queues changeNumber if it is mayor than storage changeNumber and queue is empty');
    assert.true(producer.synchronizeSplits.calledOnce, 'calls `synchronizeSplits` if `isSynchronizingSplits` is false');

    // assert queueing changeNumber if `isSynchronizingSplits` is true
    assert.equal(producer.isSynchronizingSplits(), true);
    splitUpdateWorker.put(105);
    splitUpdateWorker.put(104);
    splitUpdateWorker.put(106);
    assert.true(producer.synchronizeSplits.calledOnce, 'doesn\'t call `synchronizeSplits` while isSynchronizingSplits is true');
    assert.equal(splitUpdateWorker.maxChangeNumber, 106, 'queues changeNumber if it is mayor than currently queued changeNumber and storage changeNumber');

    // assert calling to `synchronizeSplits` if previous call is resolved and a new changeNumber in queue
    producer.__resolveSplitsUpdaterCall(0, 100);
    setTimeout(() => {
      assert.true(producer.synchronizeSplits.calledTwice, 'recalls `synchronizeSplits` if `isSynchronizingSplits` is false and queue is not empty');
      assert.equal(splitUpdateWorker.maxChangeNumber, 106, 'changeNumber stays queued until `synchronizeSplits` is settled');

      // assert dequeueing changeNumber
      producer.__resolveSplitsUpdaterCall(1, 106);
      setTimeout(() => {
        assert.true(producer.synchronizeSplits.calledTwice, 'doesn\'t call `synchronizeSplits` while queues is empty');
        assert.equal(splitUpdateWorker.maxChangeNumber, 0, ' dequeues changeNumber once `synchronizeSplits` is resolved');

        assert.end();
      });
    });
  });

  t.test('killSplit', assert => {
    // setup
    const cache = new SplitCacheInMemory();
    cache.addSplit('lol1', '{ "name": "something"}');
    cache.addSplit('lol2', '{ "name": "something else"}');

    const producer = ProducerMock(cache);
    const splitUpdateWorker = new SplitUpdateWorker(cache, producer);

    // assert calling to `synchronizeSplits` and `killLocally`, if changeNumber is new
    splitUpdateWorker.killSplit(100, 'lol1', 'off');
    assert.equal(splitUpdateWorker.maxChangeNumber, 100, 'queues changeNumber if it is mayor than storage changeNumber and queue is empty');
    assert.true(producer.synchronizeSplits.calledOnce, 'calls `synchronizeSplits` if `isSynchronizingSplits` is false');
    assertKilledSplit(assert, cache, 100, 'lol1', 'off');

    // assert not calling to `synchronizeSplits` and `killLocally`, if changeNumber is old
    producer.__resolveSplitsUpdaterCall(0, 100);
    setTimeout(() => {
      splitUpdateWorker.killSplit(90, 'lol1', 'on');
      assert.equal(splitUpdateWorker.maxChangeNumber, 0, 'doesn\'t queue changeNumber if it is minor than storage changeNumber');
      assert.true(producer.synchronizeSplits.calledOnce, 'doesn\'t call `synchronizeSplits`');
      assertKilledSplit(assert, cache, 100, 'lol1', 'off'); // calling `killLocally` makes no effect

      assert.end();
    });
  });

});