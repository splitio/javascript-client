import { SplitFactory } from '../../';
import splitChangesMockReal from '../mocks/splitchanges.real.json';
import map from 'lodash/map';
import { url } from '../testUtils';

export default async function (settings, fetchMock, assert) {
  fetchMock.getOnce({ url: url(settings, '/splitChanges?s=1.2&since=-1'), overwriteRoutes: true }, { status: 200, body: splitChangesMockReal });

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

  assert.equal(splitNames.length, mockSplits.splits.length, 'The manager.splits() method should return all split names on the factory storage.');
  assert.deepEqual(splitNames, map(mockSplits.splits, split => split.name), 'The manager.splits() method should return all split names on the factory storage.');

  const splitObj = manager.split(splitNames[0]);
  const expectedSplitObj = index => ({
    'trafficType': mockSplits.splits[index].trafficTypeName,
    'name': mockSplits.splits[index].name,
    'killed': mockSplits.splits[index].killed,
    'changeNumber': mockSplits.splits[index].changeNumber,
    'treatments': map(mockSplits.splits[index].conditions[0].partitions, partition => partition.treatment),
    'configs': mockSplits.splits[index].configurations || {},
    'sets': mockSplits.splits[index].sets || [],
    'defaultTreatment': mockSplits.splits[index].defaultTreatment
  });

  assert.equal(manager.split('non_existent'), null, 'Trying to get a manager.split() of a Split that does not exist returns null.');
  assert.deepEqual(splitObj, expectedSplitObj(0), 'If we ask for an existent one we receive the expected split view.');

  const splitObjects = manager.splits();
  assert.equal(splitObjects.length, mockSplits.splits.length, 'The manager.splits() returns the full collection of split views.');
  assert.deepEqual(splitObjects[0], expectedSplitObj(0), 'And the split views should match the items of the collection in split view format.');
  assert.deepEqual(splitObjects[1], expectedSplitObj(1), 'And the split views should match the items of the collection in split view format.');

  client.destroy();
  assert.end();
}
