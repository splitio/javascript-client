import tape from 'tape-catch';
import Redis from 'ioredis';
import splitObject from './mocks/input';
import splitView from './mocks/output';
import Manager from '../';
import SplitCacheInRedis from '../../storage/SplitCache/InRedis';
import KeyBuilder from '../../storage/Keys';
import SettingsFactory from '../../utils/settings';
import sinon from 'sinon';
const settings = SettingsFactory({
  storage: {
    type: 'REDIS'
  }
});
const contextMock = {
  get: sinon.stub().callsFake(entityName => {
    if (entityName === 'is_destroyed') return false;

    return { hasStatusManagerExtension: true };
  }),
  constants: {
    DESTROYED: 'is_destroyed',
    STATUS_MANAGER: 'status_manager'
  }
};

tape('MANAGER API / In Redis', async function(assert) {
  const connection = new Redis(settings.storage.options);
  const keys = new KeyBuilder(settings);
  const cache = new SplitCacheInRedis(keys, connection);
  const manager = new Manager(cache, contextMock);

  await cache.flush();

  await cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  const views = await manager.splits();

  assert.deepEqual( views[0] , splitView );

  connection.quit();

  assert.end();
});
