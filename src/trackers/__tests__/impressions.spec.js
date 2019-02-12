import tape from 'tape-catch';
import sinon from 'sinon';
import ImpressionsTracker from '../impressions';

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

tape('Impressions Tracker', t => {
  t.test('Tracker API', assert => {
    assert.equal(typeof ImpressionsTracker, 'function', 'The module should return a function which acts as a factory.');

    const { fakeStorage, fakeSettings } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const instance = ImpressionsTracker(contextMock);

    assert.equal(typeof instance.queue, 'function', 'The instance should implement the queue method, as it is used for multiple impressions collecting.');
    assert.equal(typeof instance.track, 'function', 'The instance should implement the track method which will actually track queued impressions.');
    assert.end();
  });

  t.test('Should be able to queue elements and track them on demand.', assert => {
    const { fakeStorage, fakeSettings } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const tracker = ImpressionsTracker(contextMock);

    tracker.queue(10);
    tracker.queue(20);
    tracker.queue(30);

    assert.false(fakeStorage.impressions.track.called, 'storage method should not be called by just queueing items.');

    tracker.track();

    assert.true(fakeStorage.impressions.track.calledWithMatch([10, 20, 30]), 'Should call the storage track method once we invoke .track() method, passing queued params in a sequence.');
    assert.end();
  });

  t.test('Queued impressions should be sent to impression listener when we invoke .track()', assert => {
    const fakeImpression = {
      fake: 'impression'
    };
    const fakeImpression2 = {
      fake: 'impression_2'
    };
    const fakeAttributes = {
      fake: 'attributes'
    };
    const { fakeStorage, fakeSettings } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const tracker = ImpressionsTracker(contextMock);

    tracker.queue(fakeImpression, fakeAttributes);
    tracker.queue(fakeImpression2, fakeAttributes);

    assert.false(fakeStorage.impressions.track.called, 'The storage should not be invoked while we are queueing impressions.');
    assert.false(fakeSettings.impressionListener.logImpression.called, 'The listener should not be invoked synchronously while we are queueing impressions.');
    setTimeout(() => {
      assert.false(fakeSettings.impressionListener.logImpression.called, 'The listener should not be invoked asynchronously either while we are queueing impressions.');

      // We signal that we actually want to track the queued impressions.
      tracker.track();
      assert.true(fakeStorage.impressions.track.calledWithMatch([fakeImpression, fakeImpression2]), 'Even with a listener, impression should be present in the collector sequence and sent to the storage');
      assert.false(fakeSettings.impressionListener.logImpression.called, 'The listener should not be executed synchronously.');

      setTimeout(() => {
        assert.true(fakeSettings.impressionListener.logImpression.calledTwice, 'The listener should be executed after the timeout wrapping make it to the queue stack, once per each impression quued.');

        assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0],
          { impression: fakeImpression, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime },
          'The listener should be executed with the corresponding map for each of the impressions.');
        assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(1).args[0],
          { impression: fakeImpression2, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime },
          'The listener should be executed with the corresponding map for each of the impressions.');

        assert.end();
      }, 0);
    }, 0);
  });
});
