import { SplitFactory } from '../../';
import splitChangesMockReal from '../mocks/splitchanges.real.json';
import map from 'lodash/map';

export default async function(settings, mock, assert) {
  mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMockReal);

  const mockSplits = splitChangesMockReal;

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<fake-token-1>'
    }
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
  const expectedSplitObj = {
    'trafficType': mockSplits.splits[0].trafficTypeName,
    'name': mockSplits.splits[0].name,
    'killed': mockSplits.splits[0].killed,
    'changeNumber': mockSplits.splits[0].changeNumber,
    'treatments': map(mockSplits.splits[0].conditions[0].partitions, partition => partition.treatment)
  };

  assert.equal(manager.split('non_existent'), null, 'Trying to get a manager.split() of a Split that does not exist returns null.');
  assert.deepEqual(splitObj, expectedSplitObj, 'If we ask for an existent one we receive the expected split view.');

  const splitObjects = manager.splits();
  assert.equal(splitObjects.length, mockSplits.splits.length, 'The manager.splits() returns the full collection of split views.');
  assert.deepEqual(splitObjects[0], expectedSplitObj, 'And the split views should match the items of the collection in split view format.');

  client.destroy();
  assert.end();
}
