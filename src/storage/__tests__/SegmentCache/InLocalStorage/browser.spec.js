import tape from 'tape-catch';
import SegmentCacheInLocalStorage from '../../../SegmentCache/InLocalStorage';
import KeyBuilder from '../../../KeysLocalStorage';
import SettingsFactory from '../../../../utils/settings';

const settings = SettingsFactory({});

tape('SEGMENT CACHE / in LocalStorage', assert => {
  const keys = new KeyBuilder(settings);
  const cache = new SegmentCacheInLocalStorage(keys);

  cache.flush();

  cache.addToSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === true );

  cache.removeFromSegment('mocked-segment');

  assert.ok( cache.isInSegment('mocked-segment') === false );

  cache.flush();
  assert.end();
});

// @BREAKING: REMOVE when removing this backwards compatibility.
tape('SEGMENT CACHE / in LocalStorage migration for mysegments keys', assert => {

  const keys = new KeyBuilder(SettingsFactory({ 
    core: { key: 'test_nico' },
    storage:{ prefix: 'LS_BC_test'}
  }));
  const cache =  new SegmentCacheInLocalStorage(keys);
  const oldKey1 = 'test_nico.LS_BC_test.SPLITIO.segment.segment1';
  const oldKey2 = 'test_nico.LS_BC_test.SPLITIO.segment.segment2';
  const newKey1 = keys.buildSegmentNameKey('segment1');
  const newKey2 = keys.buildSegmentNameKey('segment2');

  cache.flush(); // cleanup before starting.

  // Not adding a full suite for LS keys now, testing here
  assert.equal(oldKey1, keys.buildOldSegmentNameKey('segment1'));
  assert.equal('segment1', keys.extractOldSegmentKey(oldKey1));
  
  // add two segments, one we don't want to send on reset, should only be cleared, other one will be migrated.
  localStorage.setItem(oldKey1, 1);
  localStorage.setItem(oldKey2, 1);
  assert.equal(localStorage.getItem(newKey1), null, 'control assertion');

  cache.resetSegments(['segment1']);

  assert.equal(localStorage.getItem(newKey1), 1, 'The segment key for segment1, as is part of the new list, should be migrated.');
  assert.equal(localStorage.getItem(newKey2), null, 'The segment key for segment2 should not be migrated.');
  assert.equal(localStorage.getItem(oldKey1), null, 'Old keys are removed.');
  assert.equal(localStorage.getItem(oldKey2), null, 'Old keys are removed.');

  cache.flush();
  assert.end();
});