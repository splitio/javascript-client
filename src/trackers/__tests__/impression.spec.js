import tape from 'tape-catch';
import sinon from 'sinon';
import ImpressionsTracker from '../impression';

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

  return {
    fakeSettings, fakeStorage
  };
};

class ContextMock {
  constructor(fakeStorage, fakeSettings) {
    this.constants = {
      STORAGE: 'storage',
      SETTINGS: 'settings'
    };

    this.fakeStorage = fakeStorage;
    this.fakeSettings = fakeSettings;
  }

  get(target) {
    switch (target) {
      case 'storage':
        return this.fakeStorage;
      case 'settings':
        return this.fakeSettings;
      default:
        break;
    }
  }
}
/* Mocks end */

tape('Impression Tracker / API', assert => {
  assert.equal(typeof ImpressionsTracker, 'function', 'The module should return a function which acts as a factory.');

  const { fakeStorage, fakeSettings } = generateContextMocks();
  const contextMock = new ContextMock(fakeStorage, fakeSettings);
  const instance = ImpressionsTracker(contextMock);

  assert.equal(typeof instance.track, 'function', 'The instance should implement the track method.');
  assert.end();
});

tape('Impression Tracker / Propagate the value as a collection into the collector', assert => {
  const { fakeStorage, fakeSettings } = generateContextMocks();
  const contextMock = new ContextMock(fakeStorage, fakeSettings);
  const tracker = ImpressionsTracker(contextMock);

  tracker.track(10);

  assert.true(fakeStorage.impressions.track.calledWithMatch([10]), 'Should be present in the collector sequence, which is always called with a collection.');
  assert.end();
});

tape('Impression Tracker / transparently propagate the impression and attributes into a listener if provided', assert => {
  const fakeImpression = {
    fake: 'impression'
  };
  const fakeAttributes = {
    fake: 'attributes'
  };
  const { fakeStorage, fakeSettings } = generateContextMocks();
  const contextMock = new ContextMock(fakeStorage, fakeSettings);
  const tracker = ImpressionsTracker(contextMock);

  tracker.track(fakeImpression, fakeAttributes);

  assert.true(fakeStorage.impressions.track.calledWithMatch([fakeImpression]), 'Even with a listener, impression should be present in the collector sequence');
  assert.true(!fakeSettings.impressionListener.logImpression.calledOnce, 'The listener should not be executed synchronously');

  setTimeout(() => {
    assert.true(fakeSettings.impressionListener.logImpression.calledOnce, 'The listener should be executed after the timeout wrapping make it to the queue stack.');

    assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0],
      { impression: fakeImpression, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime },
      'The listener should be executed with the corresponding map.');
    assert.end();
  }, 0);
});
