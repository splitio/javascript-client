import sinon from 'sinon';
import { SplitFactory } from '../../';
import { triggerUnloadEvent } from '../testUtils/browser';
import { nearlyEqual, url } from '../testUtils';

const trackedImpressions = [];

const baseConfig = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'facundo@split.io'
  },
  startup: {
    eventsFirstPushWindow: 0
  },
  urls: {
    events: 'https://events.user-consent.io/api'
  },
  streamingEnabled: false,
  impressionListener: {
    logImpression: (impression) => {
      trackedImpressions.push(impression);
    }
  }
};

const usageFlows = [{
  // Consent granted after usage: user consent is unknown initially, and then set to granted
  initialUserConsent: 'UNKNOWN',
  setUserConsent: true,
}, {
  // Consent declined after usage: user consent is unknown initially, and then set to declined
  initialUserConsent: 'UNKNOWN',
  setUserConsent: false,
}, {
  // Consent granted before usage (default behavior): userConsent config param is granted
  initialUserConsent: 'GRANTED',
  setUserConsent: true, // no transition
}, {
  // Consent granted before usage (default behavior): userConsent config param is not defined
  initialUserConsent: undefined,
  setUserConsent: true, // no transition
}, {
  // Consent declined before usage: userConsent config param is declined
  initialUserConsent: 'DECLINED',
  setUserConsent: false, // no transition
}, {
  // Consent granted after declined: user consent is declined initially, and then set to granted
  initialUserConsent: 'DECLINED',
  setUserConsent: true,
}, {
  // Consent declined after granted: user consent is granted initially, and then set to declined
  initialUserConsent: 'GRANTED',
  setUserConsent: false,
}];

function mockSubmittersRequests(fetchMock, assert, impressionFeature, eventTypeId) {
  fetchMock.postOnce(url(baseConfig, '/testImpressions/count'), 200); // OPTIMIZED impressions mode
  fetchMock.postOnce(url(baseConfig, '/testImpressions/bulk'), (url, opts) => {
    const resp = JSON.parse(opts.body);
    assert.equal(resp[0].f, impressionFeature, 'The expected impression is submitted');
    assert.equal(resp[0].i.length, 2, '2 impressions are expected');
    return 200;
  });
  fetchMock.postOnce(url(baseConfig, '/events/bulk'), (url, opts) => {
    const resp = JSON.parse(opts.body);
    assert.equal(resp[0].eventTypeId, eventTypeId, 'The expected event is submitted');
    assert.equal(resp.length, 2, '2 events are expected');
    return 200;
  });
}

export default function userConsent(fetchMock, t) {

  // Validate trackers, submitters and browser listener behaviour on different consent status transitions
  t.test(async (assert) => {
    const sendBeaconSpy = sinon.spy(window.navigator, 'sendBeacon');
    let expectedTrackedImpressions = 0;

    for (let i = 0; i < usageFlows.length; i++) {
      const { initialUserConsent, setUserConsent } = usageFlows[i];
      const config = { ...baseConfig, userConsent: initialUserConsent };
      const factory = SplitFactory(config);
      const client = factory.client();
      const sharedClient = factory.client('marcio@split.io');

      await client.ready();
      await sharedClient.ready();

      let isTracking = factory.getUserConsent() !== 'DECLINED';
      assert.deepEqual([client.track('user', 'event1'), sharedClient.track('user', 'event1')], [isTracking, isTracking], 'tracking events on SDK ready');
      assert.deepEqual([client.getTreatment('always_on'), sharedClient.getTreatment('always_on')], ['on', 'on'], 'evaluating on SDK ready');
      if (isTracking) expectedTrackedImpressions += 2;

      // Trigger unload event to validate browser listener behaviour
      // Beacon API is used only if user consent is GRANTED
      triggerUnloadEvent();
      if (factory.getUserConsent() === 'GRANTED') {
        assert.ok(sendBeaconSpy.calledThrice, 'sendBeacon should have been called thrice');
      } else {
        assert.ok(sendBeaconSpy.notCalled, 'sendBeacon should not be called if user consent is not granted');
      }
      sendBeaconSpy.resetHistory();

      // If transitioning from UNKNOWN to GRANTED, data was tracked and will be submitted
      if (factory.getUserConsent() === 'UNKNOWN' && setUserConsent) {
        mockSubmittersRequests(fetchMock, assert, 'always_on', 'event1');
      }
      if (setUserConsent !== undefined) factory.setUserConsent(setUserConsent);

      // Await to track events and impressions with empty queues
      await new Promise(res => setTimeout(res));
      isTracking = factory.getUserConsent() !== 'DECLINED';
      assert.deepEqual([client.track('user', 'event2'), sharedClient.track('user', 'event2')], [isTracking, isTracking], 'tracking events after updating user consent');
      assert.deepEqual([client.getTreatment('always_off'), sharedClient.getTreatment('always_off')], ['off', 'off'], 'evaluating after updating user consent');
      if (isTracking) expectedTrackedImpressions += 2;

      // If destroyed while user consent is GRANTED, last tracked data is submitted
      if (factory.getUserConsent() === 'GRANTED') {
        mockSubmittersRequests(fetchMock, assert, 'always_off', 'event2');
      }
      await sharedClient.destroy();
      await client.destroy();

    }

    assert.equal(trackedImpressions.length, expectedTrackedImpressions, 'Tracked impressions are the expected');
    sendBeaconSpy.restore();
    assert.end();
  }, 'Validate trackers, submitters and browser listener behaviour on different consent status transitions');

  // Validate submitter's behaviour with full queues and with events first push window
  t.test(async (assert) => {
    const config = {
      ...baseConfig,
      userConsent: 'UNKNOWN',
      scheduler: {
        eventsQueueSize: 1,
        impressionsQueueSize: 1
      },
      startup: {
        eventsFirstPushWindow: 0.1 // 100 millis
      },
    };
    const factory = SplitFactory(config);
    const client = factory.client();

    await client.ready();

    assert.equal(client.track('user', 'event1'), true, 'Events queue is full, but submitter is not executed');
    assert.equal(client.getTreatment('always_on'), 'on', 'Impressions queue is full, but submitter is not executed');

    let submitterCalls = 0;
    const start = Date.now();
    fetchMock.postOnce(url(baseConfig, '/testImpressions/count'), () => { submitterCalls++; return 200; }); // OPTIMIZED impressions mode
    fetchMock.postOnce(url(baseConfig, '/testImpressions/bulk'), () => { submitterCalls++; return 200; });
    fetchMock.postOnce(url(baseConfig, '/events/bulk'), () => {
      const lapseSinceConsentGranted = Date.now() - start;
      assert.true(nearlyEqual(lapseSinceConsentGranted, config.startup.eventsFirstPushWindow * 1000), 'Events should be posted considering first push window');
      submitterCalls++; return 200;
    });

    factory.setUserConsent(true);

    assert.equal(submitterCalls, 2, 'Submitter is resumed and POST requests executed when consent status change to GRANTED, except for events due to first push window');

    // Awaits until events PUSH request is resolved
    await new Promise(res => setTimeout(res, config.startup.eventsFirstPushWindow * 1000 + 50));
    assert.equal(submitterCalls, 3, 'Events POST requests have been executed');

    await client.destroy();

    assert.end();
  }, 'Validate submitter\'s behaviour with full queues and with events first push window');

}
