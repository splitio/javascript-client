import tape from 'tape-catch';
import sinon from 'sinon';
import Context from '../../utils/context';
import StorageFactory from '../../storage';
import SettingsFactory from '../../utils/settings';
import BrowserSignalListener from '../browser';

const UNLOAD_DOM_EVENT = 'unload';

const windowAddEventListenerSpy = sinon.spy();
const windowRemoveEventListenerSpy = sinon.spy();

sinon.stub(window, 'addEventListener').callsFake(windowAddEventListenerSpy);
sinon.stub(window, 'removeEventListener').callsFake(windowRemoveEventListenerSpy);

const createFakeContext = function() {
  const config = {};
  const context = new Context();

  const settings = SettingsFactory(config);
  context.put(context.constants.SETTINGS, settings);

  const storage = StorageFactory(context);
  context.put(context.constants.STORAGE, storage);
  return context;
};

tape('Browser JS / Browser listener class constructor, start and stop methods', function (assert) {
  const listener = new BrowserSignalListener(createFakeContext());

  listener.start();

  // Assigned right function to right signal.
  assert.ok(windowAddEventListenerSpy.calledOnce);
  assert.ok(windowAddEventListenerSpy.calledOnceWithExactly(UNLOAD_DOM_EVENT, listener.flushData));

  // pre-check and call stop
  assert.ok(windowRemoveEventListenerSpy.notCalled);
  listener.stop();

  // removed correct listener from correct signal on stop.
  assert.ok(windowRemoveEventListenerSpy.calledOnce);
  assert.ok(windowRemoveEventListenerSpy.calledOnceWithExactly(UNLOAD_DOM_EVENT, listener.flushData));

  assert.end();
});