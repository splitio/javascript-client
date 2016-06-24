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
const splitio = require('../../');
const tape = require('tape');

tape('SDK / evaluates multiple sdks at the same time', assert => {
  const prod = splitio({
    core: {
      authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    }
  });

  const stage = splitio({
    core: {
      authorizationKey: '5p2c0r4so20ill66lm35i45h6pkvrd2skmib'
    },
    urls: {
      sdk: 'https://sdk-aws-staging.split.io/api',
      events: 'https://events-aws-staging.split.io/api'
    }
  });

  Promise.all([prod.ready(), stage.ready()]).then(() => {

    assert.equal(prod.getTreatment('node', 'get_environment', {
      env: 'prod'
    }), 'prod', 'Feature get_environment should return the treatment prod');

    assert.equal(stage.getTreatment('node', 'get_environment', {
      env: 'stage'
    }), 'stage', 'Feature get_environment should return the treatment stage');

    const prodTreatment = prod.getTreatment('node', 'get_environment', {
      env: 'qc'
    });
    const stageTreatment = stage.getTreatment('node', 'get_environment', {
      env: 'qc'
    });

    assert.equal(prodTreatment, stageTreatment,
      'Feature get_environment should return the same treatment for both sdks'
    );

    prod.destroy();
    stage.destroy();

    assert.end();
  });
});
