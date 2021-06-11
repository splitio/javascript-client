import tape from 'tape-catch';
import sinon from 'sinon';
import BrowserSignalListener from '../browser';
import { DEBUG, OPTIMIZED } from '../../utils/constants';
import ImpressionsCounter from '../../impressions/counter';

const UNLOAD_DOM_EVENT = 'unload';

const windowAddEventListenerSpy = sinon.spy(window, 'addEventListener');
const windowRemoveEventListenerSpy = sinon.spy(window, 'removeEventListener');
const sendBeaconSpy = sinon.spy(window.navigator, 'sendBeacon');

function resetHistory() {
  windowAddEventListenerSpy.resetHistory();
  windowRemoveEventListenerSpy.resetHistory();
  sendBeaconSpy.resetHistory();
}

/* Mocks start */
const generateContextMocks = () => {
  // We are only mocking the pieces we care about
  const fakeImpression = {
    feature: 'splitName',
    keyName: 'facundo@split.io',
    treatment: 'off',
    time: Date.now(),
    bucketingKey: null,
    label: null,
    changeNumber: null
  };
  const fakeEvent = {
    eventTypeId: 'someEvent',
    trafficTypeName: 'sometraffictype',
    value: null,
    timestamp: null,
    key: 'facundo@split.io',
    properties: null
  };
  const fakeSettings = {
    url: sinon.stub(),
    core: {
      labelsEnabled: true
    },
    sync: {
      impressionsMode: OPTIMIZED
    }
  };
  const fakeStorage = {
    impressions: {
      isEmpty: sinon.stub(),
      clear: sinon.stub(),
      queue: [fakeImpression],
      state() {
        return this.queue;
      }
    },
    events: {
      isEmpty: sinon.stub(),
      clear: sinon.stub(),
      queue: [fakeEvent],
      toJSON() {
        return this.queue;
      }
    }
  };

  return {
    fakeSettings, fakeStorage
  };
};

class ContextMock {
  constructor(fakeStorage, fakeSettings, shouldCreateImpressionsCounter) {
    this.constants = {
      STORAGE: 'storage',
      SETTINGS: 'settings',
      IMPRESSIONS_COUNTER: 'impressions_counter'
    };

    this.fakeStorage = fakeStorage;
    this.fakeSettings = fakeSettings;
    if (shouldCreateImpressionsCounter) {
      this.impressionsCounter = new ImpressionsCounter();
      // pollute with some mock data, to use sendBeacon
      this.impressionsCounter.inc('somefeature', Date.now(), 1);
    }
  }

  get(target) {
    switch (target) {
      case 'storage':
        return this.fakeStorage;
      case 'settings':
        return this.fakeSettings;
      case 'impressions_counter':
        return this.impressionsCounter;
      default:
        break;
    }
  }
}

const syncManagerMockWithPushManager = { pushManager: { stop: sinon.stub() } };

/* Mocks end */

function triggerUnloadEvent() {
  const event = document.createEvent('HTMLEvents');
  event.initEvent('unload', true, true);
  event.eventName = 'unload';
  window.dispatchEvent(event);
}

tape('Browser JS / Browser listener class constructor, start and stop methods', function (assert) {
  const { fakeStorage, fakeSettings } = generateContextMocks();
  const contextMock = new ContextMock(fakeStorage, fakeSettings, true);

  const listener = new BrowserSignalListener(contextMock, {} /* SyncManager mock without pushManager */);

  listener.start();

  // Assigned right function to right signal.
  assert.ok(windowAddEventListenerSpy.calledOnce);
  assert.ok(windowAddEventListenerSpy.calledOnceWithExactly(UNLOAD_DOM_EVENT, listener.flushData));

  triggerUnloadEvent();

  // Unload event was triggered. Thus sendBeacon method should have been called three times.
  assert.equal(sendBeaconSpy.callCount, 3);

  // pre-check and call stop
  assert.ok(windowRemoveEventListenerSpy.notCalled);
  listener.stop();

  // removed correct listener from correct signal on stop.
  assert.ok(windowRemoveEventListenerSpy.calledOnce);
  assert.ok(windowRemoveEventListenerSpy.calledOnceWithExactly(UNLOAD_DOM_EVENT, listener.flushData));

  assert.end();

});

tape('Browser JS Debug Mode / Browser listener class constructor, start and stop methods', function (assert) {
  resetHistory();
  const { fakeStorage, fakeSettings } = generateContextMocks();
  fakeSettings.sync = {
    impressionsMode: DEBUG
  };
  const contextMock = new ContextMock(fakeStorage, fakeSettings, false);

  const listener = new BrowserSignalListener(contextMock, syncManagerMockWithPushManager);

  listener.start();

  // Assigned right function to right signal.
  assert.ok(windowAddEventListenerSpy.calledOnce);
  assert.ok(windowAddEventListenerSpy.calledOnceWithExactly(UNLOAD_DOM_EVENT, listener.flushData));

  assert.ok(syncManagerMockWithPushManager.pushManager.stop.notCalled);

  triggerUnloadEvent();

  // Unload event was triggered. Thus sendBeacon method should have been called twice.
  assert.equal(sendBeaconSpy.callCount, 2);

  // And since we passed a syncManager with a pushManager, its stop method should have been called.
  assert.ok(syncManagerMockWithPushManager.pushManager.stop.calledOnce);

  // pre-check and call stop
  assert.ok(windowRemoveEventListenerSpy.notCalled);
  listener.stop();

  // removed correct listener from correct signal on stop.
  assert.ok(windowRemoveEventListenerSpy.calledOnce);
  assert.ok(windowRemoveEventListenerSpy.calledOnceWithExactly(UNLOAD_DOM_EVENT, listener.flushData));

  assert.end();

});