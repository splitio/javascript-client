import tape from 'tape-catch';
import sinon from 'sinon';

const processOnSpy = sinon.spy();
const processRemoveListenerSpy = sinon.spy();
const processKillSpy = sinon.spy();

sinon.stub(process, 'on').callsFake(processOnSpy);
sinon.stub(process, 'removeListener').callsFake(processRemoveListenerSpy);
sinon.stub(process, 'kill').callsFake(processKillSpy);

import NodeSignalListener from '../node';
import { getUnloadDomEvent } from '../browser';

tape('Node JS / Signal Listener class methods and start/stop functionality', function (assert) {
  const listener = new NodeSignalListener();
  const handlerMock = sinon.spy();

  listener.start(handlerMock);

  // Assigned right function to right signal.
  assert.ok(processOnSpy.calledOnce);
  assert.ok(processOnSpy.calledOnceWithExactly('SIGTERM', listener._sigtermHandler));

  // pre-check and call stop
  assert.ok(processRemoveListenerSpy.notCalled);
  listener.stop();

  // removed correct listener from correct signal on stop.
  assert.ok(processRemoveListenerSpy.calledOnce);
  assert.ok(processRemoveListenerSpy.calledOnceWithExactly('SIGTERM', listener._sigtermHandler));

  assert.end();
});

tape('Node JS / Signal Listener SIGTERM callback with sync handler', function (assert) {
  const listener = new NodeSignalListener();
  const handlerMock = sinon.spy();

  listener.start(handlerMock);
  // Stub stop function since we don't want side effects on test.
  sinon.stub(listener, 'stop');

  // Control asserts.
  assert.ok(listener.stop.notCalled);
  assert.ok(handlerMock.notCalled);
  assert.ok(processKillSpy.notCalled);

  // Call function
  listener._sigtermHandler();

  // Handler was properly called.
  assert.ok(handlerMock.calledOnce);

  // Clean up is called.
  assert.ok(listener.stop.calledOnce);
  // It called for kill again, so the shutdown keeps going.
  assert.ok(processKillSpy.calledOnce);
  assert.ok(processKillSpy.calledOnceWithExactly(process.pid, 'SIGTERM'));

  // Reset the kill spy since it's used on other tests.
  processKillSpy.resetHistory();

  assert.end();
});

tape('Node JS / Signal Listener SIGTERM callback with sync handler that throws an error', function (assert) {
  const listener = new NodeSignalListener();
  const handlerMock = sinon.stub().throws();

  listener.start(handlerMock);
  // Stub stop function since we don't want side effects on test.
  sinon.stub(listener, 'stop');

  // Control asserts.
  assert.ok(listener.stop.notCalled);
  assert.ok(handlerMock.notCalled);
  assert.ok(processKillSpy.notCalled);

  // Call function.
  listener._sigtermHandler();

  // Handler was properly called.
  assert.ok(handlerMock.calledOnce);

  // Even if the handler throws, clean up is called.
  assert.ok(listener.stop.calledOnce);
  // Even if the handler throws, it should call for kill again, so the shutdown keeps going.
  assert.ok(processKillSpy.calledOnce);
  assert.ok(processKillSpy.calledOnceWithExactly(process.pid, 'SIGTERM'));

  // Reset the kill spy since it's used on other tests.
  processKillSpy.resetHistory();

  assert.end();
});

tape('Node JS / Signal Listener SIGTERM callback with async handler', async function (assert) {
  const listener = new NodeSignalListener();
  const clock = sinon.useFakeTimers();

  const fakePromise = new Promise(res => {
    setTimeout(() => {
      res();
    }, 0);
  });

  const handlerMock = sinon.stub().returns(fakePromise);

  // Stub stop function since we don't want side effects on test.
  sinon.stub(listener, 'stop');

  // Start the listener
  listener.start(handlerMock);

  // Call function
  listener._sigtermHandler();

  // Handler was properly called.
  assert.ok(handlerMock.calledOnce);

  // Check that the wrap up is waiting for the promise to be resolved.
  assert.ok(listener.stop.notCalled);
  assert.ok(processKillSpy.notCalled);

  fakePromise.then(() => {
    // Clean up is called even if there is an error.
    assert.ok(listener.stop.calledOnce);
    // It called for kill again, so the shutdown keeps going.
    assert.ok(processKillSpy.calledOnce);
    assert.ok(processKillSpy.calledOnceWithExactly(process.pid, 'SIGTERM'));

    // Reset the kill spy since it's used on other tests.
    processKillSpy.resetHistory();

    clock.restore();
    assert.end();
  });

  // Ticking the clock, timer should execute and fake promise resolved.
  clock.next();

  return fakePromise;
});

tape('Node JS / Signal Listener SIGTERM callback with async handler that throws an error', async function (assert) {
  const listener = new NodeSignalListener();
  const fakePromise = new Promise((res, rej) => {
    setTimeout(() => {
      rej();
    }, 0);
  });
  const clock = sinon.useFakeTimers();
  const handlerMock = sinon.stub().returns(fakePromise);

  // Stub stop function since we don't want side effects on test.
  sinon.stub(listener, 'stop');

  // Start the listener
  listener.start(handlerMock);

  // Call function
  const handlerPromise = listener._sigtermHandler();

  // Handler was properly called.
  assert.ok(handlerMock.calledOnce);

  // Check that the wrap up is waiting for the promise to be resolved.
  assert.ok(listener.stop.notCalled);
  assert.ok(processKillSpy.notCalled);

  // Calling .then since the wrapUp handler does not throw.
  handlerPromise.then(() => {
    // Clean up is called.
    assert.ok(listener.stop.calledOnce);
    // It called for kill again, so the shutdown keeps going.
    assert.ok(processKillSpy.calledOnce);
    assert.ok(processKillSpy.calledOnceWithExactly(process.pid, 'SIGTERM'));

    /* Clean up everything */
    clock.restore();
    process.on.restore();
    process.removeListener.restore();
    process.kill.restore();

    assert.end();
  });

  // Ticking the clock, timer should execute and fake promise resolved.
  clock.next();

  return handlerPromise;
});

tape('getUnloadDomEvent', function (assert) {
  assert.equal(getUnloadDomEvent(), 'unload', 'returns `unload` if userAgent property is not available');

  global.navigator = { userAgent: 'Mozilla/5.0 (Android; Mobile; rv:13.0) Gecko/13.0 Firefox/13.0' };
  assert.equal(getUnloadDomEvent(), 'beforeunload', 'returns `beforeunload` if using Firefox browser');

  global.navigator.userAgent = 'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)';
  assert.equal(getUnloadDomEvent(), 'unload', 'returns `unload` if using a different user agent than Firefox browser');

  delete global.navigator;
  assert.end();
});
