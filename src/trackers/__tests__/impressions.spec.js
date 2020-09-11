import tape from 'tape-catch';
import sinon from 'sinon';
import ImpressionsTracker from '../impressions';
import { STORAGE, SETTINGS, INTEGRATIONS_MANAGER,  } from '../../utils/context/constants';
import { STANDALONE_MODE, PRODUCER_MODE, DEBUG } from '../../utils/constants';

/* Mocks start */
const generateContextMocks = () => {
  // We are only mocking the pieces we care about
  const fakeSettings = {
    mode: STANDALONE_MODE,
    runtime: { ip: 'fake-ip', hostname: 'fake-hostname' },
    version: 'js-test-10.4.0',
    impressionListener: {
      logImpression: sinon.stub()
    },
    sync: {
      impressionsMode: DEBUG
    },
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

    const imp1 = {
      feature: '10',
    };
    const imp2 = {
      feature: '20',
    };
    const imp3 = {
      feature: '30',
    };

    tracker.queue(imp1);
    tracker.queue(imp2);
    tracker.queue(imp3);

    assert.false(fakeStorage.impressions.track.called, 'storage method should not be called by just queueing items.');

    tracker.track();

    assert.true(fakeStorage.impressions.track.calledWithMatch([imp1, imp2, imp3]), 'Should call the storage track method once we invoke .track() method, passing queued params in a sequence.');
    assert.end();
  });

  const fakeImpression = {
    fake: 'impression'
  };
  const fakeImpression2 = {
    fake: 'impression_2'
  };
  const fakeAttributes = {
    fake: 'attributes'
  };

  t.test('Queued impressions should be sent to impression listener and integration manager when we invoke .track()', assert => {
    const { fakeStorage, fakeSettings, fakeIntegrationsManager } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings, fakeIntegrationsManager);
    const tracker = ImpressionsTracker(contextMock);

    tracker.queue(fakeImpression, fakeAttributes);
    tracker.queue(fakeImpression2, fakeAttributes);

    assert.false(fakeStorage.impressions.track.called, 'The storage should not be invoked while we are queueing impressions.');
    assert.false(fakeSettings.impressionListener.logImpression.called, 'The listener should not be invoked synchronously while we are queueing impressions.');
    assert.false(fakeIntegrationsManager.handleImpression.called, 'The integrations manager handleImpression method should not be invoked while we are queueing impressions.');
    setTimeout(() => {
      assert.false(fakeSettings.impressionListener.logImpression.called, 'The listener should not be invoked asynchronously either while we are queueing impressions.');
      assert.false(fakeIntegrationsManager.handleImpression.called, 'The integrations manager handleImpression method should not be invoked asynchronously either while we are queueing impressions.');

      // We signal that we actually want to track the queued impressions.
      tracker.track();
      assert.true(fakeStorage.impressions.track.calledWithMatch([fakeImpression, fakeImpression2]), 'Even with a listener, impression should be present in the collector sequence and sent to the storage');
      assert.false(fakeSettings.impressionListener.logImpression.called, 'The listener should not be executed synchronously.');
      assert.false(fakeIntegrationsManager.handleImpression.called, 'The integrations manager handleImpression method should not be executed synchronously.');

      setTimeout(() => {
        assert.true(fakeSettings.impressionListener.logImpression.calledTwice, 'The listener should be executed after the timeout wrapping make it to the queue stack, once per each impression quued.');
        assert.true(fakeIntegrationsManager.handleImpression.calledTwice, 'The integrations manager handleImpression method should be executed after the timeout wrapping make it to the queue stack, once per each impression quued.');

        const impressionData1 = { impression: fakeImpression, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime };
        const impressionData2 = { impression: fakeImpression2, attributes: fakeAttributes, sdkLanguageVersion: fakeSettings.version, ...fakeSettings.runtime };

        assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0],
          impressionData1,
          'The listener should be executed with the corresponding map for each of the impressions.');
        assert.deepEqual(fakeSettings.impressionListener.logImpression.getCall(1).args[0],
          impressionData2,
          'The listener should be executed with the corresponding map for each of the impressions.');
        assert.notEqual(fakeSettings.impressionListener.logImpression.getCall(0).args[0].impression,
          fakeImpression,
          'but impression should be a copy');
        assert.notEqual(fakeSettings.impressionListener.logImpression.getCall(1).args[0].impression,
          fakeImpression2,
          'but impression should be a copy');

        assert.deepEqual(fakeIntegrationsManager.handleImpression.getCall(0).args[0],
          impressionData1,
          'The integration manager handleImpression method should be executed with the corresponding map for each of the impressions.');
        assert.deepEqual(fakeIntegrationsManager.handleImpression.getCall(1).args[0],
          impressionData2,
          'The integration manager handleImpression method should be executed with the corresponding map for each of the impressions.');
        assert.notEqual(fakeIntegrationsManager.handleImpression.getCall(0).args[0].impression,
          fakeImpression,
          'but impression should be a copy');
        assert.notEqual(fakeIntegrationsManager.handleImpression.getCall(1).args[0].impression,
          fakeImpression2,
          'but impression should be a copy');

        assert.end();
      }, 0);
    }, 0);
  });

  t.test('Should track 3 impressions.', assert => {
    const { fakeStorage, fakeSettings } = generateContextMocks();
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const tracker = ImpressionsTracker(contextMock);

    const impression = {
      feature: 'qc_team',
      keyName: 'marcio@split.io',
      treatment: 'no',
      time: 123456789,
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };
    const impression2 = {
      feature: 'qc_team_2',
      keyName: 'marcio@split.io',
      treatment: 'yes',
      time: 123456789,
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };
    const impression3 = {
      feature: 'qc_team',
      keyName: 'marcio@split.io',
      treatment: 'no',
      time: 1234567891,
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };

    tracker.queue(impression);
    tracker.queue(impression2);
    tracker.queue(impression3);

    assert.false(fakeStorage.impressions.track.called, 'storage method should not be called by just queueing items.');

    tracker.track();

    const lastArgs = fakeStorage.impressions.track.lastCall.lastArg;

    assert.equal(lastArgs.length, 3);
    assert.equal(lastArgs[0].pt, undefined);
    assert.equal(lastArgs[0].feature, 'qc_team');
    assert.equal(lastArgs[1].pt, undefined);
    assert.equal(lastArgs[1].feature, 'qc_team_2');
    assert.equal(lastArgs[2].pt, 123456789);
    assert.equal(lastArgs[2].feature, 'qc_team');

    assert.end();
  });

  t.test('Should track 2 impressions in OPTIMIZED.', assert => {
    const { fakeStorage, fakeSettings } = generateContextMocks();
    fakeSettings.sync = {
      impressionsMode: 'OPTIMIZED',
    };
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const tracker = ImpressionsTracker(contextMock);

    const impression = {
      feature: 'qc_team',
      keyName: 'marcio@split.io',
      treatment: 'no',
      time: Date.now(),
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };
    const impression2 = {
      feature: 'qc_team_2',
      keyName: 'marcio@split.io',
      treatment: 'yes',
      time: Date.now(),
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };
    const impression3 = {
      feature: 'qc_team',
      keyName: 'marcio@split.io',
      treatment: 'no',
      time: Date.now(),
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };

    tracker.queue(impression);
    tracker.queue(impression2);
    tracker.queue(impression3);

    assert.false(fakeStorage.impressions.track.called, 'storage method should not be called by just queueing items.');

    tracker.track();

    const lastArgs = fakeStorage.impressions.track.lastCall.lastArg;

    assert.equal(lastArgs.length, 2);
    assert.equal(lastArgs[0].pt, undefined);
    assert.equal(lastArgs[0].feature, 'qc_team');
    assert.equal(lastArgs[1].pt, undefined);
    assert.equal(lastArgs[1].feature, 'qc_team_2');

    assert.end();
  });


  t.test('Should track 2 impressions in OPTIMIZED.', assert => {
    const { fakeStorage, fakeSettings } = generateContextMocks();
    fakeSettings.mode = PRODUCER_MODE;
    fakeSettings.sync = {};
    const contextMock = new ContextMock(fakeStorage, fakeSettings);
    const tracker = ImpressionsTracker(contextMock);

    const impression = {
      feature: 'qc_team',
      keyName: 'marcio@split.io',
      treatment: 'no',
      time: Date.now(),
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };
    const impression2 = {
      feature: 'qc_team_2',
      keyName: 'marcio@split.io',
      treatment: 'yes',
      time: Date.now(),
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };
    const impression3 = {
      feature: 'qc_team',
      keyName: 'marcio@split.io',
      treatment: 'no',
      time: Date.now(),
      bucketingKey: 'impr_bucketing_2',
      label: 'default rule'
    };

    tracker.queue(impression);
    tracker.queue(impression2);
    tracker.queue(impression3);

    assert.false(fakeStorage.impressions.track.called, 'storage method should not be called by just queueing items.');

    tracker.track();

    const lastArgs = fakeStorage.impressions.track.lastCall.lastArg;

    assert.equal(lastArgs.length, 3);
    assert.equal(lastArgs[0].pt, undefined);
    assert.equal(lastArgs[0].feature, 'qc_team');
    assert.equal(lastArgs[1].pt, undefined);
    assert.equal(lastArgs[1].feature, 'qc_team_2');
    assert.equal(lastArgs[2].pt, undefined);
    assert.equal(lastArgs[2].feature, 'qc_team');

    assert.end();
  });

});
