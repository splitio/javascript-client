/**
Copyright 2016 Split Software

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
**/

// @flow

'use strict';

const tape = require('tape');

function AsyncSetSuite(asyncSet : AsyncSet) {

  return tape(`${asyncSet.constructor.name} - Async Set Operations`, async function (assert) {
    // Remove possible already existent elements.
    await asyncSet.remove(['1', '2']);

    // Add 2 new elements into the Set
    await asyncSet.add(['1', '2']);

    // Verify they exists
    let has = await asyncSet.has(['1', '2']);
    assert.ok(has[0]);
    assert.ok(has[1]);

    // Remove one of the added element
    const ret = await asyncSet.remove(['1']);
    assert.equal(ret, 1);

    // Check we actually have removed the element.
    has = await asyncSet.has(['1']);
    assert.false(has[0]);

    assert.end();
  });

}

function AsyncMapSuite(asyncMap : AsyncMap) {

  return tape(`${asyncMap.constructor.name} - Async Map Operations`, async function (assert) {
    await asyncMap.remove('SPLITIO.akey');

    assert.ok( await asyncMap.get('SPLITIO.akey') == null );

    assert.ok( await asyncMap.set('SPLITIO.akey', 'a.given.string') === true );

    assert.ok( await asyncMap.get('SPLITIO.akey') ===  'a.given.string' );

    assert.ok( await asyncMap.remove('SPLITIO.akey') === 1 );

    assert.end();
  });

}

module.exports = {
  AsyncSetSuite,
  AsyncMapSuite
};
