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
import tape from 'tape-catch';
import keyParser from '../../key/parser';
import { matching, bucketing } from '../../key/factory';
import sanatize from '../../key/sanatize';

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

tape('KEY PARSER / should return a valid string if a number is passed as a param', assert => {

  const someNumber = 1234;
  const keyParsed = keyParser(someNumber);

  assert.equal(typeof keyParsed, 'object', 'key parsed should be a object');
  assert.true(keyParsed.matchingKey && keyParsed.bucketingKey, 'key parsed should has two properties');
  assert.equal(keyParsed.matchingKey, someNumber.toString(), 'matching key should be equal to some number to string');
  assert.equal(keyParsed.bucketingKey, someNumber.toString(), 'bucketing key should be equal to some number to string');

  assert.end();
});

tape('KEY PARSER / should return fail if a key isn\'t passed as a param', assert => {

  const parsedKey = keyParser(undefined);

  assert.equal(parsedKey, false, 'key parsed should return false if any key is passed within params');

  assert.end();
});

tape('KEY PARSER / should return false if a invalid key is passed as a param', assert => {

  const parsedKey = keyParser({
    matchingKey: 'some key'
  });

  assert.equal(parsedKey, false, 'key parsed should return false if a invalid key is passed within params');

  assert.end();
});

tape('KEY PARSER / should return false if a invalid key is passed as a param', assert => {

  const parsedKey = keyParser({
    bucketingKey: '100%:on'
  });

  assert.equal(parsedKey, false, 'key parsed should return false if a invalid key is passed within params');

  assert.end();
});

tape('FACTORY KEY PARSER / if a string is passed as a param it should return a string', assert => {

  const key = 'some key';
  const keyParsed = matching(key);

  assert.equal(typeof keyParsed, 'string', 'key parsed should be a string');
  assert.equal(keyParsed, key, 'key parsed should be equal to key');

  assert.end();
});

tape('FACTORY KEY PARSER / if a object is passed as a param it should return a string', assert => {

  const key = {
    matchingKey: 'some key',
    bucketingKey: 'another key'
  };

  const keyParsed = matching(key);

  assert.equal(typeof keyParsed, 'string', 'key parsed should be a string');
  assert.equal(keyParsed, key.matchingKey, 'key parsed should be equal to key');

  assert.end();
});

tape('FACTORY KEY PARSER / should return undefined if a string is passed as a param and return undefined is set', assert => {

  const key = 'simple key';

  const keyParsed = bucketing(key);

  assert.equal(keyParsed, undefined, 'key parsed should return undefined');

  assert.end();
});

tape('FACTORY KEY PARSER / should return false if a invalid key is passed as a param', assert => {

  const keyParsed = matching({
    bucketingKey: '100%:on'
  });

  assert.equal(keyParsed, false,'key parsed should return false if a invalid key is passed within params');

  assert.end();
});

tape('FACTORY KEY PARSER / should return false if a key isn\'t passed as a param', assert => {

  const keyParsed = matching(undefined);

  assert.equal(keyParsed, false, 'key parsed should be false if undefined is passed within params');

  assert.end();
});

tape('FACTORY KEY PARSER / if a number is passed as a param it should return a string', assert => {

  const key = 123456789;
  const keyParsed = matching(key);

  assert.equal(typeof keyParsed, 'string', 'key parsed should be a string');
  assert.equal(keyParsed, key.toString(), 'key parsed should be equal to key to string');

  assert.end();
});

tape('SANATIZE / if a number is passed as a param it should return a string', assert => {

  const key = 123456789;
  const keySanatized = sanatize(key);

  assert.equal(typeof keySanatized, 'string', 'keySanatized should be a string');
  assert.equal(keySanatized, key.toString(), 'keySanatized should be equal to key to string');

  assert.end();
});

tape('SANATIZE / if a string is passed as a param it should return a string', assert => {

  const key = 'some key';
  const keySanatized = sanatize(key);

  assert.equal(typeof keySanatized, 'string', 'keySanatized should be a string');
  assert.equal(keySanatized, key, 'keySanatized should be equal to key');

  assert.end();
});

tape('SANATIZE / if undefined is passed as a param it should return false', assert => {

  const keyUndefined = sanatize(undefined);
  const keyNull = sanatize(null);

  assert.equal(keyUndefined, false, 'keyUndefined should be false if a invalid key is pased within params');
  assert.equal(keyNull, false, 'keyNull should be false if a invalid key is pased within params');

  assert.end();
});
