import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import runtime from '../../utils/settings/runtime';

// Header keys and expected values. Expected values are obtained with the runtime function evaluated with IPAddressesEnabled in true.
const HEADER_SPLITSDKMACHINEIP = 'SplitSDKMachineIP';
const HEADER_SPLITSDKMACHINENAME = 'SplitSDKMachineName';
const { ip: HEADER_SPLITSDKMACHINEIP_VALUE, hostname: HEADER_SPLITSDKMACHINENAME_VALUE} = runtime(true);

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

  const finish = (function*() {
    const clients = [];
    let count = 1;
    do{
      const currentYield = yield;
      if(currentYield) {
        clients.push(currentYield);
        count--;
      }else
        count++;
    }while(count);
    clients.forEach(client => client.destroy());
    assert.end();
  })();

  function assertHeaders(IPAddressesEnabled, req){
    assert.equal(HEADER_SPLITSDKMACHINEIP in req.headers, IPAddressesEnabled, `Request must include ${HEADER_SPLITSDKMACHINEIP} header if IPAddressesEnabled is true.`);
    assert.equal(HEADER_SPLITSDKMACHINENAME in req.headers, IPAddressesEnabled, `Request must include ${HEADER_SPLITSDKMACHINENAME} header if IPAddressesEnabled is true.`);
    if(IPAddressesEnabled){
      assert.equal(req.headers[HEADER_SPLITSDKMACHINEIP], HEADER_SPLITSDKMACHINEIP_VALUE, `${HEADER_SPLITSDKMACHINEIP} header must be equal to the machine ip.`);
      assert.equal(req.headers[HEADER_SPLITSDKMACHINENAME], HEADER_SPLITSDKMACHINENAME_VALUE, `${HEADER_SPLITSDKMACHINENAME} header must be equal to the machine name.`);
    }
  }

  function mockAndAssertIPAddressesEnabled(config, endpointToMock, clientAction){
    finish.next();

    const splitio = SplitFactory(config);
    const client = splitio.client();
    const settings = SettingsFactory(config);
  
    mock.onPost(settings.url(endpointToMock)).replyOnce(req => {
      assertHeaders(settings.core.IPAddressesEnabled, req);
      finish.next(client);
      return [200];
    });
  
    clientAction(client);
  }

  const endpointToMock = '/events/bulk';
  const clientAction = client => client.track('nicolas@split.io', 'sometraffictype', 'someEvent', 10);

  mockAndAssertIPAddressesEnabled(configWithIPAddressesEnabled, endpointToMock, clientAction);
  mockAndAssertIPAddressesEnabled(configWithIPAddressesDisabled, endpointToMock, clientAction);
  mockAndAssertIPAddressesEnabled(configWithIPAddressesDefault, endpointToMock, clientAction);

}
  