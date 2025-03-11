import { SplitFactory } from '../../';
import splitChangesMockReal from '../mocks/splitchanges.real.json';
import map from 'lodash/map';
import { url } from '../testUtils';

export default async function (settings, fetchMock, assert) {
  fetchMock.getOnce({ url: url(settings, '/splitChanges?s=1.3&since=-1&rbSince=-1'), overwriteRoutes: true }, { status: 200, body: splitChangesMockReal });

  const mockSplits = splitChangesMockReal;

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<fake-token-1>',
      key: 'marcio@split.io'
    },
    streamingEnabled: false
  });
  const client = splitio.client();
  const manager = splitio.manager();
  const manager2 = splitio.manager();

  assert.equal(manager, manager2, 'Does not matter how many times you call .manager(), you get the same instance for the same factory.');
  assert.equal(manager.ready, client.ready, 'And it shares all readiness methods with the main client.');
  assert.equal(manager.on, client.on, 'And it shares all readiness methods with the main client.');
  assert.equal(manager.once, client.once, 'And it shares all readiness methods with the main client.');
  assert.equal(manager.Event, client.Event, 'And it shares all readiness constants with the main client.');

  await client.ready();

  const splitNames = manager.names();

  assert.equal(splitNames.length, mockSplits.ff.d.length, 'The manager.splits() method should return all split names on the factory storage.');
  assert.deepEqual(splitNames, map(mockSplits.ff.d, split => split.name), 'The manager.splits() method should return all split names on the factory storage.');

  const splitObj = manager.split(splitNames[0]);
  const expectedSplitObj = index => ({
    'trafficType': mockSplits.ff.d[index].trafficTypeName,
    'name': mockSplits.ff.d[index].name,
    'killed': mockSplits.ff.d[index].killed,
    'changeNumber': mockSplits.ff.d[index].changeNumber,
    'treatments': map(mockSplits.ff.d[index].conditions[0].partitions, partition => partition.treatment),
    'configs': mockSplits.ff.d[index].configurations || {},
    'sets': mockSplits.ff.d[index].sets || [],
    'defaultTreatment': mockSplits.ff.d[index].defaultTreatment,
    'impressionsDisabled': false
  });

  assert.equal(manager.split('non_existent'), null, 'Trying to get a manager.split() of a Split that does not exist returns null.');
  assert.deepEqual(splitObj, expectedSplitObj(0), 'If we ask for an existent one we receive the expected split view.');

  const splitObjects = manager.splits();
  assert.equal(splitObjects.length, mockSplits.ff.d.length, 'The manager.splits() returns the full collection of split views.');
  assert.deepEqual(splitObjects[0], expectedSplitObj(0), 'And the split views should match the items of the collection in split view format.');
  assert.deepEqual(splitObjects[1], expectedSplitObj(1), 'And the split views should match the items of the collection in split view format.');

  client.destroy();
  assert.end();
}
