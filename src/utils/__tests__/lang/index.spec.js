import tape from 'tape-catch';
import { merge, uniq } from '../../lang';

tape('LANG UTILS / merge', function(assert) {
  let obj1 = {};
  let res1 = merge(obj1, { something: 'else' });

  assert.ok(res1 === obj1, 'It merges on the target, modifying that object and returning it too.');


  assert.deepEqual(merge({ a: 'a', b: 'b' }, { c: 'c' }), { a: 'a', b: 'b', c: 'c' }, 'Should be able to merge simple objects, an unlimited amount of them.');
  assert.deepEqual(merge({ a: 'a', b: 'b' }, { c: 'c' }, { d: 'd' }), { a: 'a', b: 'b', c: 'c', d: 'd' }, 'Should be able to merge simple objects, an unlimited amount of them.');
  assert.deepEqual(merge({ a: 'a' }, { b: 'b'}, { c: 'c' }, { d: 'd' }), { a: 'a', b: 'b', c: 'c', d: 'd' }, 'Should be able to merge simple objects, an unlimited amount of them.');

  obj1 = {
    a: 'a',
    abc: { b: 'b', c: 'c' },
    arr: [1,2]
  };
  let obj2 = {
    a: 'not a anymore',
    d: 'd'
  };

  // Two objects with complex structures but not in common.
  assert.deepEqual(merge(obj1, obj2), {
    a: 'not a anymore',
    abc: { b: 'b', c: 'c' },
    d: 'd',
    arr: [1,2]
  }, 'Should be able to merge complex objects');

  obj1 = {
    a: 'a',
    abc: { b: 'b', c: 'c' }
  };

  obj2 = {
    a: 'not a anymore',
    abc: { c: 'not c anymore', d: 'd' }
  };

  // Two objects with object property in common
  assert.deepEqual(merge(obj1, obj2), {
    a: 'not a anymore',
    abc: { b: 'b', c: 'not c anymore', d: 'd' },
  }, 'Should be able to merge complex objects');

  obj2.abc.d = { ran: 'dom' };

  // Two objects with object property in common and with objects in it.
  assert.deepEqual(merge(obj1, obj2), {
    a: 'not a anymore',
    abc: { b: 'b', c: 'not c anymore', d: { ran: 'dom' }},
  }, 'Should be able to merge complex objects');

  obj1.abc = 'abc';

  // Two objects with property in common, as object on source.
  assert.deepEqual(merge(obj1, obj2), {
    a: 'not a anymore',
    abc: { c: 'not c anymore', d: { ran: 'dom' }}
  }, 'Should be able to merge complex objects');

  obj1.abc = { a: 'obja', b: 'objb' };
  obj2.abc = 'str';

  // Two objects with property in common, as object on target. Source should always take precedence.
  assert.deepEqual(merge(obj1, obj2), {
    a: 'not a anymore',
    abc: 'str'
  }, 'Should be able to merge complex objects');

  obj1 = {
    1: '1',
    abc: { a: 'a', b: 'b' }
  };
  obj2 = {
    2: '2',
    abc: { a: 'a2', c: 'c' }
  };
  let obj3 = {
    3: '3',
    abc: { c: 'c3', d: { d: 'd' }},
    33: {
      3: 3
    }
  };

  // Three complex objects.
  assert.deepEqual(merge(obj1, obj2, obj3), {
    1: '1', 2: '2', 3: '3', 33: { 3: 3 },
    abc: { a: 'a2', b: 'b', c: 'c3', d: { d: 'd' }}
  }, 'Should be able to merge complex objects, an unlimited amount of them.');

  let obj4 = {
    33: {
      4: false
    }
  };
  delete obj2.abc; // This removes the reference.
  obj1.abc.a = 'a'; // Remember that it merges on the target.

  // Four complex objects, not all of them have the object prop.
  assert.deepEqual(merge(obj1, obj2, obj3, obj4), {
    1: '1', 2: '2', 3: '3', 33: { 3: 3, 4: false },
    abc: { a: 'a', b: 'b', c: 'c3', d: { d: 'd' }}
  }, 'Should be able to merge complex objects, an unlimited amount of them.');
  assert.deepEqual(obj1, {
    1: '1', 2: '2', 3: '3', 33: { 3: 3, 4: false },
    abc: { a: 'a', b: 'b', c: 'c3', d: { d: 'd' }}
  }, 'Always modifying the target.');

  obj2.abc = undefined; // We should avoid undefined values.

  // Four complex objects, all of them have the object prop but one instead of object, undefined.
  assert.deepEqual(merge(obj1, obj2, obj3, obj4), {
    1: '1', 2: '2', 3: '3', 33: { 3: 3, 4: false },
    abc: { a: 'a', b: 'b', c: 'c3', d: { d: 'd' }}
  }, 'Should be able to merge complex objects, an unlimited amount of them and still filter undefined props.');

  res1 = {};
  assert.ok(merge(res1, obj1) === res1, 'Always returns the modified target.');
  assert.deepEqual(res1, obj1, 'If target is an empty object, it will be a clone of the source on that one.');

  assert.end();
});

tape('LANG UTILS / uniq', function(assert) {
  assert.deepEqual(uniq(['1', '2', '1', '3', '3', '4', '3']), ['1', '2', '3', '4'], 'uniq should remove all duplicate strings from array.');
  assert.deepEqual(uniq(['2', '2']), ['2'], 'uniq should remove all duplicate strings from array.');
  assert.deepEqual(uniq(['2', '3']), ['2', '3'], 'uniq should remove all duplicate strings from array.');
  assert.deepEqual(uniq(['3', '2', '3']), ['3', '2'], 'uniq should remove all duplicate strings from array.');

  assert.end();
});
