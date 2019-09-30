import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

// Header constants
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
    authorizationKey: '<fake-token>'
  },
  urls: {
    sdk: 'https://sdk.split-ipdefault.io/api',
    events: 'https://events.split-ipdefault.io/api'
  },
  scheduler
};

export default function ipAddressesSettingAssertions(mock, assert) {

  let splitioEnabled = SplitFactory(configWithIPAddressesEnabled);
  let clientEnabled = splitioEnabled.client();
  const settingsEnabled = SettingsFactory(configWithIPAddressesEnabled);

  mock.onPost(settingsEnabled.url('/events/bulk')).replyOnce(req => {
    assert.equal(HEADER_SPLITSDKMACHINEIP in req.headers, true, `Request must include ${HEADER_SPLITSDKMACHINEIP} header.`);
    assert.equal(HEADER_SPLITSDKMACHINENAME in req.headers, true, `Request must include ${HEADER_SPLITSDKMACHINENAME} header.`);
    clientEnabled.destroy();
    return [200];
  });

  clientEnabled.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10);

  let splitioDisabled = SplitFactory(configWithIPAddressesDisabled);
  let clientDisabled = splitioDisabled.client();
  const settingsDisabled = SettingsFactory(configWithIPAddressesDisabled);

  mock.onPost(settingsDisabled.url('/events/bulk')).replyOnce(req => {
    assert.equal(HEADER_SPLITSDKMACHINEIP in req.headers, false, `Request must not include ${HEADER_SPLITSDKMACHINEIP} header.`);
    assert.equal(HEADER_SPLITSDKMACHINENAME in req.headers, false, `Request must not include ${HEADER_SPLITSDKMACHINENAME} header.`);
    clientDisabled.destroy();
    return [200];
  });

  clientDisabled.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10);

  let splitioDefault = SplitFactory(configWithIPAddressesDefault);
  let clientDefault = splitioDefault.client();
  const settingsDefault = SettingsFactory(configWithIPAddressesDefault);

  mock.onPost(settingsDefault.url('/events/bulk')).replyOnce(req => {
    assert.equal(HEADER_SPLITSDKMACHINEIP in req.headers, true, `Request must include ${HEADER_SPLITSDKMACHINEIP} header.`);
    assert.equal(HEADER_SPLITSDKMACHINENAME in req.headers, true, `Request must include ${HEADER_SPLITSDKMACHINENAME} header.`);
    clientDefault.destroy();
    assert.end();
    return [200];
  });

  clientDefault.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10);
}
  