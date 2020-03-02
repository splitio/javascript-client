import tape from 'tape-catch';
import sinon from 'sinon';
import ImpressionTracker from '../impression';
import { STORAGE, SETTINGS, INTEGRATIONS_MANAGER } from '../../utils/context/constants';

/* Mocks start */
const generateContextMocks = () => {
  // We are only mocking the pieces we care about
  const fakeSettings = {
    runtime: { ip: 'fake-ip', hostname: 'fake-hostname' },
    version: 'js-test-10.4.0',
    impressionListener: {
      logImpression: sinon.stub()
    }
  };
  const fakeStorage = {
    impressions: {
      track: sinon.stub()
    }
  };
  const fakeIntegrationsManager = {
    handleImpression: sinon.stub()
  };

  return {
    fakeSettings, fakeStorage, fakeIntegrationsManager
  };
};

class ContextMock {
  constructor(fakeStorage, fakeSettings, fakeIntegrationsManager) {
    this.constants = {
      STORAGE,
      SETTINGS,
      INTEGRATIONS_MANAGER,
    };

    this.fakeStorage = fakeStorage;
    this.fakeSettings = fakeSettings;
    this.fakeIntegrationsManager = fakeIntegrationsManager;
  }

  get(target) {
    switch (target) {
      case STORAGE:
        return this.fakeStorage;
      case SETTINGS:
        return this.fakeSettings;
      case INTEGRATIONS_MANAGER:
        return this.fakeIntegrationsManager;
      default:
        break;
    }
  }
}
/* Mocks end */

tape('Impression Tracker', t => {
  t.test('Tracker API', assert => {
    assert.equal(typeof ImpressionTracker, 'function', 'The module should return a function which acts as a factory.');

    const { fakeStorage, fakeSettings } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const instance = ImpressionTracker(contextMock);

    assert.equal(typeof instance.track, 'function', 'The instance should implement the track method.');
    assert.end();
  });

  t.test('Propagate the value as a collection into the collector', assert => {
    const { fakeStorage, fakeSettings } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const tracker = ImpressionTracker(contextMock);

    tracker.track(10);

    assert.true(fakeStorage.impressions.track.calledWithMatch([10]), 'Should be present in the collector sequence, which is always called with a collection.');
    assert.end();
  });

  const fakeImpression = {
    fake: 'impression'
  };
  const fakeAttributes = {
    fake: 'attributes'
  };

  t.test('Transparently propagate the impression and attributes into a listener and integration manager if provided', assert => {
    const { fakeStorage, fakeSettings, fakeIntegrationsManager } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings, fakeIntegrationsManager);
    const tracker = ImpressionTracker(contextMock);

    tracker.track(fakeImpression, fakeAttributes);

    assert.true(fakeStorage.impressions.track.calledWithMatch([fakeImpression]), 'Even with a listener, impression should be present in the collector sequence');
    assert.true(!fakeSettings.impressionListener.logImpression.calledOnce, 'The listener should not be executed synchronously');
    assert.true(!fakeIntegrationsManager.handleImpression.calledOnce, 'The integration manager handleImpression method should not be executed synchronously.');

    setTimeout(() => {
      assert.true(fakeSettings.impressionListener.logImpression.calledOnce, 'The listener should be executed after the timeout wrapping make it to the queue stack.');
      assert.true(fakeIntegrationsManager.handleImpression.calledOnce, 'The integration manager handleImpression method should be executed after the timeout wrapping make it to the queue stack.');

      const impressionData = { impression: fakeImpression, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime };
      assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0],
        impressionData,
        'The listener should be executed with the corresponding map.');
      assert.notEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0].impression,
        fakeImpression,
        'but impression should be a copy');
      assert.deepEqual(fakeIntegrationsManager.handleImpression.getCall(0).args[0],
        impressionData,
        'The integration manager handleImpression method should be executed with the corresponding map.');
      assert.notEqual(fakeIntegrationsManager.handleImpression.getCall(0).args[0].impression,
        fakeImpression,
        'but impression should be a copy');
      assert.end();
    }, 0);
  });

});
