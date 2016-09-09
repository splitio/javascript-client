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

const splitio = require('../../');
const ava = require('ava');

ava('SDK / check the event SDK_READY is fired', assert => {
  const prod = splitio({
    core: {
      authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    },
    scheduler: {
      // fetch feature updates each 15 sec
      featuresRefreshRate: 15,
      // fetch segments updates each 30 sec
      segmentsRefreshRate: 30,
      // publish metrics each 600 sec
      metricsRefreshRate: 600,
      // publish evaluations each 600 sec
      impressionsRefreshRate: 600
    },
    startup: {
      // initial requests will have a stretch timeout
      requestTimeoutBeforeReady: 10,
      // if something fails because a timeout or a network error, retry at least
      retriesOnFailureBeforeReady: 0,
      // fires SDK_READY_TIMEOUT after this amount of seconds
      readyTimeout: 0
    }
  });

  assert.plan(1);
  prod.on(prod.Event.SDK_READY, () => {
    prod.destroy();
    assert.pass('ready event fired');
  });
});
