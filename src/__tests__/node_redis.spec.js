import tape from 'tape-catch';
import { SplitFacade } from '../';

const config = {
  core: {
    authorizationKey: 'uoj4sb69bjv7d4d027f7ukkitd53ek6a9ai9'
  },
  urls: {
    sdk: 'https://sdk-aws-staging.split.io/api',
    events: 'https://events-aws-staging.split.io/api'
  },
  mode: 'consumer',
  storage: {
    type: 'REDIS',
    prefix: 'REDIS_NODE_UT'
  }
};

tape('NodeJS Redis', async function (assert) {

  const sdk = SplitFacade(config);
  const client = sdk.client();

  assert.equal(await client.getTreatment('UT_Segment_member', 'UT_IN_SEGMENT'), 'on');
  assert.equal(await client.getTreatment('other', 'UT_IN_SEGMENT'), 'off');

  assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_IN_SEGMENT'), 'off');
  assert.equal(await client.getTreatment('other', 'UT_NOT_IN_SEGMENT'), 'on');

  assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
    permissions: ['admin']
  }), 'on');
  assert.equal(await client.getTreatment('UT_Segment_member', 'UT_SET_MATCHER', {
    permissions: ['not_matching']
  }), 'off');

  assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
    permissions: ['create']
  }), 'off');
  assert.equal(await client.getTreatment('UT_Segment_member', 'UT_NOT_SET_MATCHER', {
    permissions: ['not_matching']
  }), 'on');

  assert.equal(await client.getTreatment('UT_Segment_member', 'always-on'), 'on');

  // Below splits were added manually to the redis_mock.json file.
  // They are all_keys (always evaluate to on) which depend from always-on split. the _on/off is what treatment they are expecting there.
  assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on'), 'on');
  assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_off'), 'off');
  assert.equal(await client.getTreatment('UT_Segment_member', 'hierarchical_splits_testing_on_negated'), 'off');

  client.destroy();

  assert.end();

});
