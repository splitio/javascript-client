import tape from 'tape-catch';
import splitObject from './mocks/input';
import splitView from './mocks/output';
import Manager from '../';
import SplitCacheInMemory from '../../storage/SplitCache/InMemory';
import sinon from 'sinon';

const contextMock = {
  get: sinon.stub().returns(false),
  constants: {
    DESTROYED: 'is_destroyed'
  }
};

tape('MANAGER API / In Memory / List all splits', function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache, contextMock);

  cache.addSplit( splitObject.name, JSON.stringify(splitObject) );

  const views = manager.splits();

  assert.deepEqual( views[0] , splitView );
  assert.end();
});

tape('MANAGER API / In Memory / Read only one split by name', function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache, contextMock);

  cache.addSplit(splitObject.name, JSON.stringify(splitObject));

  const split = manager.split(splitObject.name);

  assert.deepEqual(split, splitView);
  assert.end();
});

tape('MANAGER API / In Memory / List all the split names', function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache, contextMock);

  cache.addSplit(splitObject.name, JSON.stringify(splitObject));

  const names = manager.names();

  assert.true(names.indexOf(splitObject.name) !== -1);
  assert.end();
});

tape('MANAGER API / In Memory / Input Validation', function(assert) {
  const cache = new SplitCacheInMemory();
  const manager = new Manager(cache, contextMock);

  cache.addSplit(splitObject.name, JSON.stringify(splitObject));
  // control assertions to verify that the manager is connected with that cache.
  assert.ok(manager.split(splitObject.name), 'control assertion for split.');
  assert.ok(manager.splits().length > 0, 'control assertion for splits.');
  assert.ok(manager.names().length > 0, 'control assertion for names.');

  assert.equal(manager.split(undefined), null, 'If the split name is invalid, `manager.split(invalidName)` returns null.');

  // This is kind of tied to the implementation of the isOperational validator.
  contextMock.get.returns(true);

  assert.equal(manager.split(splitObject.name), null, 'If the factory/client is destroyed, `manager.split(validName)` will return null either way since the storage is not valid.');
  assert.deepEqual(manager.splits(), [], 'If the factory/client is destroyed, `manager.splits()` will return empty array either way since the storage is not valid.');
  assert.deepEqual(manager.names(), [], 'If the factory/client is destroyed, `manager.names()` will return empty array either way since the storage is not valid.');

  assert.end();
});
