import tape from 'tape-catch';
import sinon from 'sinon';
import {
  startsWith,
  endsWith,
  get,
  findIndex,
  find,
  isString,
  isFinite,
  uniqueId,
  merge,
  uniq,
  groupBy
} from '../../lang';

tape('LANG UTILS / startsWith', function(assert) {
  assert.ok(startsWith('myStr', 'myS'));
  assert.ok(startsWith('this is something', 'this is'));

  assert.notOk(startsWith('myStr', 'yS'));
  assert.notOk(startsWith(' myStr', 'yS'));
  assert.notOk(startsWith('myStr', ' yS'));
  assert.notOk(startsWith('myStr', null));
  assert.notOk(startsWith(false, null));
  assert.notOk(startsWith());
  assert.notOk(startsWith(null, 'ys'));

  assert.end();
});

tape('LANG UTILS / endsWith', function(assert) {
  assert.ok(endsWith('myStr', 'Str'));
  assert.ok(endsWith('is a str', ' str'));

  assert.notOk(endsWith('myStr', 'Sr'));
  assert.notOk(endsWith('myStr ', 'tr'));
  assert.notOk(endsWith('myStr', 'tr '));
  assert.notOk(endsWith('myStr', null));
  assert.notOk(endsWith(false, null));
  assert.notOk(endsWith());
  assert.notOk(endsWith(null, 'ys'));

  assert.end();
});

tape('LANG UTILS / get', function(assert) {
  const obj = {
    simple: 'simple',
    undef: undefined,
    deepProp: {
      sample: 'sample',
      deeperProp: {
        deeper: true
      }
    }
  };

  // negative
  assert.equal(get(obj, 'not_exists', 'default'), 'default', 'If the property path does not match a property of the source, return the default value.');
  assert.equal(get(obj, 'undef', 'default'), 'default', 'If the property is found but the value is undefined, return the default value.');
  assert.equal(get(obj, 'undef.crap', 'default'), 'default', 'If the property path is incorrect and could cause an error, return the default value.');
  assert.equal(get(obj, null, 'default'), 'default', 'If the property path is of wrong type, return the default value.');
  assert.equal(get(obj, /regex/, 'default'), 'default', 'If the property path is of wrong type, return the default value.');
  assert.equal(get(null, 'simple', 'default'), 'default', 'If the source is of wrong type, return the default value.');
  assert.equal(get(/regex/, 'simple', 'default'), 'default', 'If the source is of wrong type, return the default value.');

  // positive
  assert.equal(get(obj, 'simple', 'default'), 'simple', 'If the property path (regardless of how "deep") matches a defined property of the object, returns that value instead of default.');
  assert.equal(get(obj, 'deepProp.sample', 'default'), 'sample', 'If the property path (regardless of how "deep") matches a defined property of the object, returns that value instead of default.');
  assert.equal(get(obj, 'deepProp.deeperProp.deeper', 'default'), true, 'If the property path (regardless of how "deep") matches a defined property of the object, returns that value instead of default.');
  assert.deepEqual(get(obj, 'deepProp.deeperProp', 'default'), {
    deeper: true
  }, 'If the property path (regardless of how "deep") matches a defined property of the object, returns that value (regardless of the type) instead of default.');

  assert.end();
});

tape('LANG UTILS / findIndex', function(assert) {
  const arr = [1,2,3,4,3];

  assert.equal(findIndex(), -1, 'If the parameters for findIndex are wrong it returns -1.');
  assert.equal(findIndex(null, () => {}), -1, 'If the parameters for findIndex are wrong it returns -1.');
  assert.equal(findIndex({}, () => {}), -1, 'If the parameters for findIndex are wrong it returns -1.');
  assert.equal(findIndex({}, false), -1, 'If the parameters for findIndex are wrong it returns -1.');

  assert.equal(findIndex(arr, () => false), -1, 'If no element causes iteratee to return truthy, it returns -1.');
  assert.equal(findIndex(arr, e => e === 5), -1, 'If no element causes iteratee to return truthy, it returns -1.');

  assert.equal(findIndex(arr, e => e === 1), 0, 'It should return the index of the first element that causes iteratee to return truthy.');
  assert.equal(findIndex(arr, e => e === 2), 1, 'It should return the index of the first element that causes iteratee to return truthy.');
  assert.equal(findIndex(arr, e => e === 3), 2, 'It should return the index of the first element that causes iteratee to return truthy.');

  /* Not testing the params received by iteratee because we know that Array.prototype.findIndex works ok */

  assert.end();
});

tape('LANG UTILS / find', function(assert) {
  assert.equal(find(), undefined, 'We cant find the element if the collection is wrong type, so we return undefined.');
  assert.equal(find(null, () => true), undefined, 'We cant find the element if the collection is wrong type, so we return undefined.');

  assert.equal(find([], () => true), undefined, 'If the collection is empty there is no element to be found, so we return undefined.');
  assert.equal(find({}, () => true), undefined, 'If the collection is empty there is no element to be found, so we return undefined.');

  const spy = sinon.spy();
  const obj = { myKey: 'myVal', myOtherKey: 'myOtherVal' };

  find(obj, spy);
  assert.ok(spy.calledTwice, 'The iteratee should be called as many times as elements we have on the collection.');
  assert.ok(spy.firstCall.calledWithExactly('myVal', 'myKey', obj), 'When iterating on an object the iteratee should be called with (val, key, collection)');
  assert.ok(spy.secondCall.calledWithExactly('myOtherVal', 'myOtherKey', obj), 'When iterating on an object the iteratee should be called with (val, key, collection)');

  const arr = ['one', 'two'];
  spy.resetHistory();

  find(arr, spy);
  assert.ok(spy.calledTwice, 'The iteratee should be called as many times as elements we have on the collection.');
  assert.ok(spy.firstCall.calledWithExactly('one', 0, arr), 'When iterating on an array the iteratee should be called with (val, index, collection)');
  assert.ok(spy.secondCall.calledWithExactly('two', 1, arr), 'When iterating on an array the iteratee should be called with (val, index, collection)');

  assert.equal(find({
    val1: '1',
    val2: '2'
  }, e => e === '2'), '2', 'If an element causes iteratee to return a truthy value, that value is returned.');
  assert.equal(find(['uno', 'dos'], e => e === 'uno'), 'uno', 'If an element causes iteratee to return a truthy value, that value is returned.');

  assert.end();
});

tape('LANG UTILS / isString', function(assert) {
  assert.ok(isString(''), 'Should return true for strings.');
  assert.ok(isString('asd'), 'Should return true for strings.');
  assert.ok(isString(new String('asdf')), 'Should return true for strings.');

  assert.notOk(isString(), 'Should return false for non-strings.');
  assert.notOk(isString(null), 'Should return false for non-strings.');
  assert.notOk(isString([]), 'Should return false for non-strings.');
  assert.notOk(isString({}), 'Should return false for non-strings.');
  assert.notOk(isString(/regex/), 'Should return false for non-strings.');

  assert.end();
});

tape('LANG UTILS / isFinite', function(assert) {
  assert.ok(isFinite(1), 'Should return true for finite numbers.');
  assert.ok(isFinite(new Number(4)), 'Should return true for finite numbers.');

  assert.notOk(isFinite(), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(Infinity), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(-Infinity), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(NaN), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(new Number(Infinity)), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(new Number(NaN)), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(null), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite([]), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite({}), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite(/regex/), 'Should return false for anything that is not a finite number.');
  assert.notOk(isFinite('5'), 'Should return false for anything that is not a finite number.');

  assert.end();
});

tape('LANG UTILS / uniqueId', function(assert) {
  let currId = -100;
  let prevId = -100;

  for(let i = 0; i < 10; i++) {
    currId = uniqueId();
    assert.ok(prevId < currId, 'Each time we call the function, the new ID should be different (greater than) the previous one.');
    prevId = currId;
  }

  assert.end();
});

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

tape('LANG UTILS / groupBy', function(assert) {
  let arr = [{
    team: 'SDK',
    name: 'Nico',
    ex: 'glb'
  }, {
    team: 'SDK',
    name: 'Martin'
  }, {
    team: 'QA',
    name: 'Adrian',
    ex: 'glb'
  }];

  assert.deepEqual(groupBy(arr, 'team'), {
    SDK: [{ team: 'SDK', name: 'Nico', ex: 'glb' }, { team: 'SDK', name: 'Martin' }],
    QA: [{ team: 'QA', name: 'Adrian', ex: 'glb' }]
  }, 'Should group by the property specified respecting the order of appearance.');
  assert.deepEqual(groupBy(arr, 'not_exist'), {}, 'If the property specified does not exist on the elements the map will be empty.');
  assert.deepEqual(groupBy(arr, 'ex'), {
    glb: [{ team: 'SDK', name: 'Nico', ex: 'glb' }, { team: 'QA', name: 'Adrian', ex: 'glb' }]
  }, 'If the property specified does not exist on all the elements the ones without it will be skipped.');


  assert.deepEqual(groupBy([], 'team'), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy(null, 'team'), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy(undefined, 'team'), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy(true, 'team'), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy('string', 'team'), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy({}, 'team'), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy({ something: 1 }, null), {}, 'If the input is empty or wrong type, it will return an empty object.');
  assert.deepEqual(groupBy({ something: 1 }), {}, 'If the input is empty or wrong type, it will return an empty object.');

  assert.end();
});
