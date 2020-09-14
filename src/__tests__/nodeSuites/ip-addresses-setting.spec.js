import osFunction from 'os';
import ipFunction from 'ip';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import { STANDALONE_MODE, CONSUMER_MODE, DEBUG } from '../../utils/constants';

// Header keys and expected values. Expected values are obtained with the runtime function evaluated with IPAddressesEnabled in true.
const HEADER_SPLITSDKMACHINEIP = 'SplitSDKMachineIP';
const HEADER_SPLITSDKMACHINENAME = 'SplitSDKMachineName';
const IP_VALUE = ipFunction.address();
const HOSTNAME_VALUE = osFunction.hostname();
const NA = 'NA';

// Refresh rates are set to 1 second to finish the test quickly. Otherwise, it would finish in 1 minute (60 seconds is the default value)
const baseConfig = {
  scheduler: {
    metricsRefreshRate: 1,
    impressionsRefreshRate: 1,
    eventsPushRate: 1
  },
  streamingEnabled: false,
  sync: {
    impressionsMode: DEBUG,
  }
};

// Config with IPAddressesEnabled set to false
const configWithIPAddressesDisabled = {
  ...baseConfig,
  core: {
    authorizationKey: '<fake-token>',
    IPAddressesEnabled: false
  },
  urls: {
    sdk: 'https://sdk.split-ipdisabled.io/api',
    events: 'https://events.split-ipdisabled.io/api'
  }
};

// Config with IPAddressesEnabled set to true
const configWithIPAddressesEnabled = {
  ...baseConfig,
  core: {
    authorizationKey: '<fake-token>',
    IPAddressesEnabled: true
  },
  urls: {
    sdk: 'https://sdk.split-ipenabled.io/api',
    events: 'https://events.split-ipenabled.io/api'
  }
};

// Config with default IPAddressesEnabled (true)
const configWithIPAddressesDefault = {
  ...baseConfig,
  core: {
    authorizationKey: '<fake-token>'
  },
  urls: {
    sdk: 'https://sdk.split-ipdefault.io/api',
    events: 'https://events.split-ipdefault.io/api'
  }
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

export default function ipAddressesSettingAssertions(fetchMock, assert) {

  // Generator to synchronize the call of assert.end() when all Splitio configurations are run.
  const finish = (function* () {
    const CONFIG_SAMPLES_COUNT = configSamples.length;
    for (let i = 0; i < CONFIG_SAMPLES_COUNT - 1; i++) {
      yield;
    }
    assert.end();
  })();

  // Assert properties in impressions
  function assertImpression(IPAddressesEnabled, Mode, impression) {
    assert.equal(impression.ip, IPAddressesEnabled ? IP_VALUE : Mode === STANDALONE_MODE ? false : NA, `If IPAddressesEnabled, "ip" property in impressions must be equal to the machine ip. If not, it must be equal to "${NA}" for "${CONSUMER_MODE}" mode" or false for "${STANDALONE_MODE}" mode.`);
    assert.equal(impression.hostname, IPAddressesEnabled ? HOSTNAME_VALUE : Mode === STANDALONE_MODE ? false : NA, `If IPAddressesEnabled, "hostname" property in impressions must be equal to the machine hostname. If not, it must be equal to "${NA}" for "${CONSUMER_MODE}" mode" or false for "${STANDALONE_MODE}" mode.`);
  }

  // Assert request headers
  function assertHeaders(IPAddressesEnabled, req) {
    assert.equal(HEADER_SPLITSDKMACHINEIP in req.headers, IPAddressesEnabled, `Request must ${IPAddressesEnabled ? '' : 'NOT '} include ${HEADER_SPLITSDKMACHINEIP} header if IPAddressesEnabled is ${IPAddressesEnabled}.`);
    assert.equal(HEADER_SPLITSDKMACHINENAME in req.headers, IPAddressesEnabled, `Request must ${IPAddressesEnabled ? '' : 'NOT '} include ${HEADER_SPLITSDKMACHINENAME} header if IPAddressesEnabled is ${IPAddressesEnabled}.`);
    if (IPAddressesEnabled) {
      assert.equal(req.headers[HEADER_SPLITSDKMACHINEIP], IP_VALUE, `If present, ${HEADER_SPLITSDKMACHINEIP} header must be equal to the machine ip.`);
      assert.equal(req.headers[HEADER_SPLITSDKMACHINENAME], HOSTNAME_VALUE, `If present, ${HEADER_SPLITSDKMACHINENAME} header must be equal to the machine name.`);
    }
  }

  function mockAndAssertIPAddressesEnabled(config) {

    config.impressionListener = {
      logImpression: function (impression) {
        assertImpression(config.core.IPAddressesEnabled === undefined ? true : config.core.IPAddressesEnabled, config.mode === undefined ? STANDALONE_MODE : config.mode, impression);
      }
    };
    const splitio = SplitFactory(config);
    const client = splitio.client();
    const settings = SettingsFactory(config);

    // Generator to synchronize the destruction of the client when all the post endpoints where called once.
    const finishConfig = (function* () {
      const POST_ENDPOINTS_TO_TEST = postEndpoints.length;
      for (let i = 0; i < POST_ENDPOINTS_TO_TEST - 1; i++) {
        yield;
      }
      client.destroy();
      finish.next();
    })();

    // Mock GET endpoints to run client normally
    fetchMock.getOnce(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 });
    fetchMock.getOnce(settings.url('/splitChanges?since=1457552620999'), { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
    fetchMock.get(new RegExp(`${settings.url('/segmentChanges/')}.*`), { status: 200, body: { since: 10, till: 10, name: 'segmentName', added: [], removed: [] } });

    // Mock and assert POST endpoints
    postEndpoints.forEach(postEndpoint => {
      fetchMock.postOnce(settings.url(postEndpoint), (url, opts) => {
        assertHeaders(settings.core.IPAddressesEnabled, opts);
        finishConfig.next();
        return 200;
      });
      fetchMock.post(settings.url(postEndpoint), 200);
    });

    // Run normal client flow
    client.on(client.Event.SDK_READY, () => {
      client.getTreatment('nicolas@split.io', 'hierarchical_splits_test');
      client.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10);
    });

  }

  configSamples.forEach(
    configSample => mockAndAssertIPAddressesEnabled(configSample)
  );
}
