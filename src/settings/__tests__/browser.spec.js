import tape from 'tape-catch';
import { settingsFactory } from '../browser';

tape('SETTINGS / Integrations should be properly parsed', assert => {
  const settings = settingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    integrations: [
      { type: 'GOOGLE_ANALYTICS_TO_SPLIT', prefix: 'prefix1' },
      { type: 'INVALID_INTEGRATION', prefix: 'prefix2' },
      { type: 'SPLIT_TO_GOOGLE_ANALYTICS', prefix: 'prefix3' },
      { type: 'INVALID_INTEGRATION_2', prefix: 'prefix4' },
      {},
      'INVALID'
    ]
  });

  assert.deepEqual(settings.integrations, [
    { type: 'GOOGLE_ANALYTICS_TO_SPLIT', prefix: 'prefix1' },
    { type: 'SPLIT_TO_GOOGLE_ANALYTICS', prefix: 'prefix3' }
  ], 'Filters invalid integrations from `integrations` array');

  assert.deepEqual(settingsFactory({
    core: {
      authorizationKey: 'dummy token'
    },
    integrations: 'INVALID'
  }).integrations, [], 'Returns an empty array if `integrations` is an invalid object');

  assert.end();
});
