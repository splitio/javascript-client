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
import SettingsFactory from '../../settings';

tape('SETTINGS / Redis options hould be properly parsed', assert => {
  const settingsWithUrl = SettingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    storage: {
      type: 'REDIS',
      options: {
        url: 'test_url',
        host: 'h', port: 'p', db: 'bla', pass: 'nope',
        randomProp: 'I will not be present',
        connectionTimeout: 11,
        operationTimeout: 22
      },
      prefix: 'test_prefix'
    }
  });
  const settingsWithoutUrl = SettingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    storage: {
      type: 'REDIS',
      options: {
        host: 'host', port: 'port', pass: 'pass', db: 'db',
        randomProp: 'I will not be present',
        connectionTimeout: 33,
        operationTimeout: 44
      },
      prefix: 'test_prefix'
    }
  });

  assert.deepEqual(settingsWithUrl.storage, {
    type: 'REDIS', prefix: 'test_prefix.SPLITIO', options: { url: 'test_url', connectionTimeout: 11, operationTimeout: 22 }
  }, 'Redis storage settings and options should be passed correctly, url settings takes precedence when we are pointing to Redis.');

  assert.deepEqual(settingsWithoutUrl.storage, {
    type: 'REDIS', prefix: 'test_prefix.SPLITIO', options: { host: 'host', port: 'port', pass: 'pass', db: 'db', connectionTimeout: 33, operationTimeout: 44 }
  }, 'Redis storage settings and options should be passed correctly, url settings takes precedence when we are pointing to Redis.');

  assert.end();
});
