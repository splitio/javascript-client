import sinon from 'sinon';

import { SplitFactory } from '../../';

const listener = {
  logImpression: sinon.stub()
};

const config = {
  core: {
    authorizationKey: '<fake-token-3>'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    metricsRefreshRate: 3000,
    impressionsRefreshRate: 3000
  },
  startup: {
    eventsFirstPushWindow: 3000
  },
  impressionListener: listener
};

export default function(assert) {
  const splitio = SplitFactory(config);
  const client = splitio.client();

  client.on(client.Event.SDK_READY, () => {
    // Generate one impression, depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    client.getTreatment('impr_1_key', 'hierarchical_splits_test');

    assert.true(listener.logImpression.called, 'Impression listener logImpression method should be called after we call client.getTreatment.');
    // client.getTreatment({ matchingKey: 'impr_matching_2', bucketingKey: 'impr_bucketing_2' }, 'qc_team');
    // client.getTreatment('impr_3_key', 'qc_team');

    assert.end();
  });
}
