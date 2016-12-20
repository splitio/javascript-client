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
'use strict';

const tape = require('tape');
const keyParser = require('../../key/parser');
const impressionsKeyParser = require('../../key/impressions');

tape('KEY PARSER / if a string is passed a param should return a object', assert => {

  const key = 'some key';
  const keyParsed = keyParser(key);

  assert.equal(typeof keyParsed, 'object', 'key parsed should be a object');
  assert.true(keyParsed.matchingKey && keyParsed.bucketingKey, 'key parsed should has two properties');
  assert.equal(keyParsed.matchingKey, key,'matching key should be equal to key');
  assert.equal(keyParsed.bucketingKey, key,'bucketing key should be equal to key');

  assert.end();
});

tape('KEY PARSER / should return the keys configurations', assert => {

  const matchingKey = 'some key';
  const bucketingKey = '100%:on';
  const keyParsed = keyParser({matchingKey, bucketingKey});

  assert.equal(typeof keyParsed, 'object', 'key parsed should be a object');
  assert.true(keyParsed.matchingKey && keyParsed.bucketingKey, 'key parsed should has two properties');
  assert.equal(keyParsed.matchingKey, matchingKey,'matching key should be equal to matchingKey');
  assert.equal(keyParsed.bucketingKey, bucketingKey,'matching key should be equal to bucketingKey');

  assert.end();
});

tape('KEY PARSER / should fail if a key isn\'t passed as a param', assert => {

  try {
    keyParser(undefined);
  } catch(e) {
    assert.ok(e, 'key parsed should throw an exception if any key is passed within params');
  }

  assert.end();
});

tape('KEY PARSER / should fail if a invalid key is passed as a param', assert => {

  try {
    keyParser({
      matchingKey: 'some key'
    });
  } catch(e) {
    assert.ok(e, 'key parsed should throw an exception if a invalid key is passed within params');
  }

  assert.end();
});

tape('KEY PARSER / should fail if a invalid key is passed as a param', assert => {

  try {
    keyParser({
      bucketingKey: '100%:on'
    });
  } catch(e) {
    assert.ok(e, 'key parsed should throw an exception if a invalid key is passed within params');
  }

  assert.end();
});

tape('KEY IMPRESSIONS PARSER / if a string is passed as a param it should return a string', assert => {

  const key = 'some key';
  const keyParsed = impressionsKeyParser(key);

  assert.equal(typeof keyParsed, 'string', 'key parsed should be a string');
  assert.equal(keyParsed, key, 'key parsed should be equal to key');

  assert.end();
});

tape('KEY IMPRESSIONS PARSER / if a object is passed as a param it should return a string', assert => {

  const key = {
    matchingKey: 'some key',
    bucketingKey: 'another key'
  };

  const keyParsed = impressionsKeyParser(key);

  assert.equal(typeof keyParsed, 'string', 'key parsed should be a string');
  assert.equal(keyParsed, key.matchingKey, 'key parsed should be equal to key');

  assert.end();
});

tape('KEY IMPRESSIONS PARSER / should fail if a invalid key is passed as a param', assert => {

  try {
    keyParser({
      bucketingKey: '100%:on'
    });
  } catch(e) {
    assert.ok(e, 'key parsed should throw an exception if a invalid key is passed within params');
  }

  assert.end();
});

tape('KEY IMPRESSIONS PARSER / should fail if a key isn\'t passed as a param', assert => {

  try {
    keyParser(undefined);
  } catch(e) {
    assert.ok(e, 'key parsed should throw an exception if undefined is passed within params');
  }

  assert.end();
});
