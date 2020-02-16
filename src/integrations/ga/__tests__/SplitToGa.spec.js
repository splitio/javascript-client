/**
 * Unit tests:
 *  DONE- SplitToGa.validateFieldsObject
 *  - SplitToGa.defaultFilter
 *  - SplitToGa.defaultMapper
 *  - SplitToGa.getGa
 *  - SplitToGa.prototype.constructor
 *  - SplitToGa.prototype.queue
 */

import tape from 'tape';
import SplitToGa from '../SplitToGa';

tape('SplitToGa', t => {

  t.test('SplitToGa.validateFieldsObject', assert => {
    assert.equal(SplitToGa.validateFieldsObject(undefined), false);
    assert.equal(SplitToGa.validateFieldsObject(null), false);
    assert.equal(SplitToGa.validateFieldsObject(123), false);
    assert.equal(SplitToGa.validateFieldsObject(true), false);
    assert.equal(SplitToGa.validateFieldsObject('something'), false);
    assert.equal(SplitToGa.validateFieldsObject(/asd/ig), false);
    assert.equal(SplitToGa.validateFieldsObject(function () { }), false);

    assert.equal(SplitToGa.validateFieldsObject({}), false, 'An empty object is an invalid FieldsObject instance');
    assert.equal(SplitToGa.validateFieldsObject({ hitType: 10 }), false, 'HitType must not be other than a string object');
    assert.equal(SplitToGa.validateFieldsObject({ hitType: 'event' }), true, 'HitType must be a string object');

    assert.end();
  });

});
