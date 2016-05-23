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
const tape = require('tape');
const settings = require('../../../lib/settings');

tape('SETTINGS / check defaults', assert => {
  settings.configure({
    core: {
      authorizationKey: 'dummy token'
    }
  });

  assert.deepEqual(settings.get('urls'), {
    sdk: 'https://sdk.split.io/api',
    events: 'https://events.split.io/api'
  });
  assert.end();
});

tape('SETTINGS / urls should be configurable', assert => {
  const urls = {
    sdk: 'sdk-url',
    events: 'events-url'
  };

  settings.configure({
    core: {
      authorizationKey: 'dummy token'
    },
    urls
  });

  assert.deepEqual(settings.get('urls'), urls);
  assert.end();
});
