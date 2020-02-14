import tape from 'tape';
import { validateIdentities } from '../GaToSplit';

/**
 * DONE-validateIdentities
 * -defaultFilter
 * -mapperBuilder & defaultBuilder
 * -GaToSplitFactory & SplitTracker: requires GA mock
 */

tape('validateIdentities', assert => {
  assert.equal(validateIdentities(undefined), undefined);
  assert.equal(validateIdentities(null), undefined);
  assert.equal(validateIdentities(123), undefined);
  assert.equal(validateIdentities(true), undefined);
  assert.equal(validateIdentities('something'), undefined);
  assert.equal(validateIdentities({}), undefined);
  assert.equal(validateIdentities(/asd/ig), undefined);
  assert.equal(validateIdentities(function () { }), undefined);

  assert.deepEqual(validateIdentities([]), []);
  assert.deepEqual(validateIdentities([undefined, /asd/ig, function () { }]), []);
  assert.deepEqual(validateIdentities([{
    key: 'key', trafficType: 'user' // First occurence of this item
  }, {
    key: 'key', trafficType: function(){} // Invalid item (invalid TT)
  }, {
    key: 'keyu', trafficType: 'ser' // First occurence of this item
  }, {
    key: true, trafficType: 'user' // Invalid item (invalid key)
  }, {
    key: 'key2', trafficType: 'user2' // First occurence of this item
  }, {
    key: 12, trafficType: 'user' // First occurence of this item
  }, {
    key: 'key', trafficType: 'user' // Duplicated item
  },
  {} // Invalid item (undefined key and traffic type)
  ]), [{
    key: 'key', trafficType: 'user'
  }, {
    key: 'keyu', trafficType: 'ser'
  }, {
    key: 'key2', trafficType: 'user2'
  }, {
    key: 12, trafficType: 'user'
  }]);
  assert.end();
});