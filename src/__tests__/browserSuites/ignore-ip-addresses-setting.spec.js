import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';

// Header keys and expected values. Expected values are obtained with the runtime function evaluated with IPAddressesEnabled in true.
const HEADER_SPLITSDKMACHINEIP = 'SplitSDKMachineIP';
const HEADER_SPLITSDKMACHINENAME = 'SplitSDKMachineName';

// Refresh rates are set to 1 second to finish the test quickly. Otherwise, it would finish in 1 minute (60 seconds is the default value)
const scheduler = {
  metricsRefreshRate: 1,
  impressionsRefreshRate: 1,
  eventsPushRate: 1
};

// Config with IPAddressesEnabled set to false
const configWithIPAddressesDisabled = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io',
    IPAddressesEnabled: false
  },
  urls: {
    sdk: 'https://sdk.split-ipdisabled.io/api',
    events: 'https://events.split-ipdisabled.io/api'
  },
  scheduler
};

// Config with IPAddressesEnabled set to true
const configWithIPAddressesEnabled = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io',
    IPAddressesEnabled: true
  },
  urls: {
    sdk: 'https://sdk.split-ipenabled.io/api',
    events: 'https://events.split-ipenabled.io/api'
  },
  scheduler
};

// Config with default IPAddressesEnabled (true)
const configWithIPAddressesDefault = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'nicolas@split.io'
  },
  urls: {
    sdk: 'https://sdk.split-ipdefault.io/api',
    events: 'https://events.split-ipdefault.io/api'
  },
  scheduler
};

const configSamples = [
  configWithIPAddressesDisabled,
  configWithIPAddressesEnabled,
  configWithIPAddressesDefault
];

const postEndpoints = [
  '/events/bulk',
  '/testImpressions/bulk',
  '/metrics/times',
  '/metrics/counters'
];

export default function(mock, assert) {

  // Generator to synchronize the call of assert.end() when all Splitio configurations are run.
  const finish = (function*() {
    const CONFIG_SAMPLES_COUNT = configSamples.length;
    for (let i = 0; i < CONFIG_SAMPLES_COUNT-1; i++) {
      yield;
    }
    assert.end();
  })();

  // Assert request headers
  function assertHeaders(IPAddressesEnabled, req) {
    assert.false(HEADER_SPLITSDKMACHINEIP in req.headers, `Request must not include ${HEADER_SPLITSDKMACHINEIP} header, no matters the value of IPAddressesEnabled.`);
    assert.false(HEADER_SPLITSDKMACHINENAME in req.headers, `Request must not include ${HEADER_SPLITSDKMACHINENAME} header, no matters the value of IPAddressesEnabled.`);
  }

  function mockAndAssertIPAddressesEnabled(config) {

    // Assert properties in impressions logged to impression listener
    config.impressionListener = {
      logImpression: function(impression) {
        assert.false(impression.ip, '"ip" property in impressions must be false, no matters the value of IPAddressesEnabled.');
        assert.false(impression.hostname, '"hostname" property in impressions must be false, no matters the value of IPAddressesEnabled.');
      }
    };

    // Init Split client
    const splitio = SplitFactory(config);
    const client = splitio.client();
    const settings = SettingsFactory(config);

    // Generator to synchronize the destruction of the client when all the post endpoints where called once.
    const finishConfig = (function*() {
      const POST_ENDPOINTS_TO_TEST = postEndpoints.length;
      for (let i = 0; i < POST_ENDPOINTS_TO_TEST-1; i++) {
        yield;
      }
      client.destroy();
      finish.next();
    })();

    // Mock and assert POST endpoints
    postEndpoints.forEach( postEndpoint => {
      mock.onPost(settings.url(postEndpoint)).replyOnce(req => {
        assertHeaders(settings.core.IPAddressesEnabled, req);
        finishConfig.next();
        return [200];
      });
    });
    
    // Run normal client flow 
    client.ready().then(() => {
      client.getTreatment('hierarchical_splits_test');
      client.track('sometraffictype', 'someEvent', 10);
    });
  }

  configSamples.forEach(
    configSample => mockAndAssertIPAddressesEnabled(configSample)
  );

}