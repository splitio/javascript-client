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
import utils from '../../../engine/murmur3';

tape('MURMUR3', function (t) {

  function assertText(text, assert) {
    const lines = text.trim().split(/\r\n|\n|\r/);

    assert.plan(2 * lines.length);

    for(let parts of lines) {
      setTimeout(() => {
        let [seed, key, hash, bucket] = parts.split(',');

        seed = parseInt(seed, 10);
        hash = parseInt(hash, 10);
        bucket = parseInt(bucket, 10);

        assert.equal(utils.hash(key, seed), hash);
        assert.equal(utils.bucket(key, seed), bucket);
      }, Math.random() * 10);
    }
  }

  t.test('validate hashing behavior using basic dataset', assert => {
    fetch('/base/engine/__tests__/engine/mocks/murmur3-sample-data-v2.csv')
      .then(response => response.text())
      .then(text => assertText(text, assert))
      .catch(error => assert.error(error));
  });

  t.test('validate hashing behavior using chinese dataset', assert => {
    fetch('/base/engine/__tests__/engine/mocks/murmur3-sample-data-non-alpha-numeric-v2.csv')
      .then(response => response.text())
      .then(text => assertText(text, assert))
      .catch(error => assert.error(error));
  });
});
