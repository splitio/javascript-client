const tape = require('tape');
const map = require('lodash/map');
const pick = require('lodash/pick');

const SplitFactory = require('../../');

const fetchMock = require('fetch-mock');

const SettingsFactory = require('../../utils/settings');
const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  }
});

const splitChangesMock1 = require('./splitChanges.since.-1.json');
const splitChangesMock2 = require('./splitChanges.since.1500492097547.json');
const impressionsMock = require('./impressions.json');

const delayResponse = (mock) => {
  return new Promise(res => setTimeout(res, 0)).then(() => mock);
};

fetchMock.mock(settings.url('/splitChanges?since=-1'), () => delayResponse(splitChangesMock1));
fetchMock.mock(settings.url('/splitChanges?since=1500492097547'), () => delayResponse(splitChangesMock2));

tape('SDK destroy for NodeJS', async function (assert) {
  const config = {
    core: {
      authorizationKey: 'fake-key',
      key: 'facundo@split.io'
    },
    mode: 'standalone'
  };

  const factory = SplitFactory(config);
  const client = factory.client();
  const manager = factory.manager();

  // Assert we are sending the impressions while doing the destroy
  fetchMock.post(settings.url('/testImpressions/bulk'), request => {
    return request.json().then(impressions => {
      impressions[0].keyImpressions = map(impressions[0].keyImpressions, imp => pick(imp, ['keyName', 'treatment']));

      assert.deepEqual(impressions, impressionsMock);
    });
  });

  await client.ready();

  client.getTreatment('ut1', 'Single_Test');
  client.getTreatment('ut2', 'Single_Test');
  client.getTreatment('ut3', 'Single_Test');

  await client.destroy();

  assert.equal( client.getTreatment('ut1', 'Single_Test'), 'control' );

  assert.equal( manager.splits().length , 0 );
  assert.equal( manager.names().length ,  0 );
  assert.equal( manager.split('Single_Test') , null );

  assert.end();
});
