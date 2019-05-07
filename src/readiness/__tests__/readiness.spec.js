/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

import tape from 'tape-catch';
import ReadinessGate from '../';

tape('READINESS GATE / Share splits but segments (without timeout enabled)', function (assert) {
  assert.plan(2);

  const ReadinessGateFactory = ReadinessGate();
  const readinessGate1 = ReadinessGateFactory();
  const readinessGate2 = ReadinessGateFactory();

  readinessGate1.gate.on(readinessGate1.gate.SDK_READY, () => {
    assert.pass('should be called');
  }).on(readinessGate1.gate.SDK_UPDATE, () => {
    assert.fail('should be called');
    assert.end();
  });

  readinessGate2.gate.on(readinessGate2.gate.SDK_READY, () => {
    assert.pass('should be called');
  }).on(readinessGate2.gate.SDK_UPDATE, () => {
    assert.fail('should not be called');
    assert.end();
  });

  // Simulate state transitions
  setTimeout(() => {
    readinessGate1.splits.emit(readinessGate1.splits.SDK_SPLITS_ARRIVED);
  }, 1000 * Math.random());
  setTimeout(() => {
    readinessGate1.segments.emit(readinessGate1.segments.SDK_SEGMENTS_ARRIVED);
  }, 1000 * Math.random());
  setTimeout(() => {
    readinessGate2.segments.emit(readinessGate2.segments.SDK_SEGMENTS_ARRIVED);
  }, 1000 * Math.random());
});

tape('READINESS GATE / Ready event should be fired once', function (assert) {
  const ReadinessGateFactory = ReadinessGate();
  const readinessGate = ReadinessGateFactory();
  let counter = 0;

  readinessGate.gate.on(readinessGate.gate.SDK_READY, () => {
    counter++;
  });

  readinessGate.splits.emit(readinessGate.splits.SDK_SPLITS_ARRIVED);
  readinessGate.segments.emit(readinessGate.segments.SDK_SEGMENTS_ARRIVED);
  readinessGate.splits.emit(readinessGate.splits.SDK_SPLITS_ARRIVED);
  readinessGate.segments.emit(readinessGate.segments.SDK_SEGMENTS_ARRIVED);
  readinessGate.splits.emit(readinessGate.splits.SDK_SPLITS_ARRIVED);
  readinessGate.segments.emit(readinessGate.segments.SDK_SEGMENTS_ARRIVED);

  assert.equal(counter, 1, 'should be called once');
  assert.end();
});

tape('READINESS GATE / Update event should be fired after the Ready event', function (assert) {
  const ReadinessGateFactory = ReadinessGate();
  const readinessGate = ReadinessGateFactory();
  let isReady = false;
  let counter = 0;

  readinessGate.gate.on(readinessGate.gate.SDK_READY, () => {
    counter++;
    isReady = true;
  });

  readinessGate.gate.on(readinessGate.gate.SDK_UPDATE, () => {
    isReady && counter++;
  });

  readinessGate.splits.emit(readinessGate.splits.SDK_SPLITS_ARRIVED);
  readinessGate.segments.emit(readinessGate.segments.SDK_SEGMENTS_ARRIVED);

  readinessGate.splits.emit(readinessGate.splits.SDK_SPLITS_ARRIVED);
  readinessGate.segments.emit(readinessGate.segments.SDK_SEGMENTS_ARRIVED);
  readinessGate.splits.emit(readinessGate.splits.SDK_SPLITS_ARRIVED);
  readinessGate.segments.emit(readinessGate.segments.SDK_SEGMENTS_ARRIVED);

  assert.equal(counter, 5, 'should count 1 ready plus 4 updates');
  assert.end();
});

tape('READINESS GATE / Segment updates should not be propagated', function (assert) {
  assert.plan(2);

  const ReadinessGateFactory = ReadinessGate();
  const readinessGate1 = ReadinessGateFactory();
  const readinessGate2 = ReadinessGateFactory();

  readinessGate2.gate.on(readinessGate2.gate.SDK_UPDATE, () => {
    assert.pass('should be called');
  });

  readinessGate1.gate.on(readinessGate1.gate.SDK_UPDATE, () => {
    assert.fail('should not be called');
  });

  readinessGate1.splits.emit(readinessGate1.splits.SDK_SPLITS_ARRIVED);
  readinessGate2.segments.emit(readinessGate2.segments.SDK_SEGMENTS_ARRIVED);
  readinessGate2.segments.emit(readinessGate2.segments.SDK_SEGMENTS_ARRIVED);
  readinessGate2.segments.emit(readinessGate2.segments.SDK_SEGMENTS_ARRIVED);
});

tape('READINESS GATE / Timeout ready event', function (assert) {
  assert.plan(1);

  const ReadinessGateFactory = ReadinessGate();
  const readiness = ReadinessGateFactory(10);

  let isReady = false;
  let timeoutCounter = 0;

  readiness.gate.on(readiness.gate.SDK_READY_TIMED_OUT, () => {
    if (!isReady) timeoutCounter++;
  });

  readiness.gate.on(readiness.gate.SDK_READY, () => {
    isReady = true;
    assert.equal(timeoutCounter, 1, 'Timeout was scheduled to be fired quickly');
  });

  setTimeout(() => {
    readiness.splits.emit(readiness.splits.SDK_SPLITS_ARRIVED);
    readiness.segments.emit(readiness.segments.SDK_SEGMENTS_ARRIVED);
  }, 50);
});

tape('READINESS GATE / Cancel timeout if ready fired', function (assert) {
  assert.plan(2);
  const timeoutMs = 100;

  const ReadinessGateFactory = ReadinessGate();
  const readiness = ReadinessGateFactory(timeoutMs);

  readiness.gate.on(readiness.gate.SDK_READY_TIMED_OUT, assert.fail.bind(assert, 'SDK_READY_TIMED_OUT should have not been emitted.'));
  readiness.gate.once(readiness.gate.SDK_READY, assert.pass);

  setTimeout(() => {
    assert.pass('After a considerably longer time than the timeout, the timeout event never fired (otherwise assert.fail was invoked).');
  }, timeoutMs * 3);

  setTimeout(() => {
    readiness.splits.emit(readiness.splits.SDK_SPLITS_ARRIVED);
    readiness.segments.emit(readiness.segments.SDK_SEGMENTS_ARRIVED);
  }, timeoutMs * 0.8);
});

tape('READINESS GATE / Destroy after it was ready', function (assert) {
  assert.plan(1);

  const ReadinessGateFactory = ReadinessGate();
  const readiness = ReadinessGateFactory(20000);

  let counter = 0;

  readiness.gate.on(readiness.gate.SDK_UPDATE, () => {
    counter++;
  });

  readiness.splits.emit(readiness.splits.SDK_SPLITS_ARRIVED);
  readiness.segments.emit(readiness.segments.SDK_SEGMENTS_ARRIVED); // ready state

  readiness.segments.emit(readiness.segments.SDK_SEGMENTS_ARRIVED); // fires an update

  readiness.destroy(); // Destroy the gate, removing all the listeners and clearing the ready timeout.
  readiness.destroy(); // no-op
  readiness.destroy(); // no-op

  readiness.segments.emit(readiness.segments.SDK_SPLITS_ARRIVED); // fires an update
  readiness.segments.emit(readiness.segments.SDK_SEGMENTS_ARRIVED); // fires an update

  assert.equal(counter, 1, 'Second update event should be discarded');
});

tape('READINESS GATE / Destroy before it was ready', function (assert) {
  assert.plan(1);

  const ReadinessGateFactory = ReadinessGate();
  const readiness = ReadinessGateFactory(360000000); // 100hrs, test would time out if it does not work as expcted

  setTimeout(() => {
    assert.pass('Calling destroy should have removed the readyTimeout and the test should end now.');
  }, 2000); // 2s

  readiness.destroy(); // Destroy the gate, removing all the listeners and clearing the ready timeout.
});
