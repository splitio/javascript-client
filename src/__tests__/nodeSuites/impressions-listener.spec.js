import sinon from 'sinon';

import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const settings = settingsFactory({
  core: {
    key: '<fake id>'
  },
  streamingEnabled: false
});

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
  },
  impressionListener: listener,
  streamingEnabled: false
};

export default function (assert) {
  const splitio = SplitFactory(config);
  const client = splitio.client();

  return client.ready().then(() => {
    const metaData = {
      ip: settings.runtime.ip,
      hostname: settings.runtime.hostname,
      sdkLanguageVersion: settings.version
    };
    const testAttrs = { is_test: true };

    // Generate one impression, depends on hierarchical_dep_hierarchical which depends on hierarchical_dep_always_on
    client.getTreatment('nicolas@split.io', 'hierarchical_splits_test');
    client.getTreatment({ matchingKey: 'marcio@split.io', bucketingKey: 'impr_bucketing_2' }, 'qc_team');
    client.getTreatment('facundo@split.io', 'qc_team', testAttrs);
    client.getTreatment('facundo@split.io', 'qc_team', testAttrs);

    setTimeout(() => {
      assert.true(listener.logImpression.callCount, 4, 'Impression listener logImpression method should be called after we call client.getTreatment, once per each impression generated.');
      assert.true(listener.logImpression.getCall(0).calledWithMatch({
        impression: {
          feature: 'hierarchical_splits_test',
          keyName: 'nicolas@split.io',
          treatment: 'on',
          bucketingKey: undefined,
          label: 'expected label',
        },
        attributes: undefined,
        ...metaData
      }));
      assert.true(listener.logImpression.getCall(1).calledWithMatch({
        impression: {
          feature: 'qc_team',
          keyName: 'marcio@split.io',
          treatment: 'no',
          bucketingKey: 'impr_bucketing_2',
          label: 'default rule',
        },
        attributes: undefined,
        ...metaData
      }));
      assert.true(listener.logImpression.getCall(2).calledWithMatch({
        impression: {
          feature: 'qc_team',
          keyName: 'facundo@split.io',
          treatment: 'no',
          bucketingKey: undefined,
          label: 'default rule',
        },
        attributes: testAttrs,
        ...metaData
      }));
      assert.true(listener.logImpression.getCall(3).calledWithMatch({
        impression: {
          feature: 'qc_team',
          keyName: 'facundo@split.io',
          treatment: 'no',
          bucketingKey: undefined,
          label: 'default rule',
          pt: listener.logImpression.getCall(2).lastArg.impression.time
        },
        attributes: testAttrs,
        ...metaData
      }));

      client.destroy();
      assert.end();
    }, 0);
  });
}
