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
    client.getTreatment('nicolas@split.io', 'hierarchical_splits_test', undefined, { properties: { prop1: 'prop-value' } });
    client.getTreatment({ matchingKey: 'marcio@split.io', bucketingKey: 'impr_bucketing_2' }, 'qc_team');
    client.getTreatment('facundo@split.io', 'qc_team', testAttrs);
    client.getTreatment('facundo@split.io', 'qc_team', testAttrs);
    client.getTreatment('facundo@split.io', 'whitelist', testAttrs, { impressionsDisabled: false });

    setTimeout(() => {
      assert.equal(listener.logImpression.callCount, 5, 'Impression listener logImpression method should be called after we call client.getTreatment, once per each impression generated.');
      assert.true(listener.logImpression.getCall(0).calledWithExactly({
        impression: {
          feature: 'hierarchical_splits_test',
          keyName: 'nicolas@split.io',
          treatment: 'on',
          time: listener.logImpression.getCall(0).args[0].impression.time,
          bucketingKey: undefined,
          label: 'expected label',
          changeNumber: 2828282828,
          properties: '{"prop1":"prop-value"}'
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
      assert.true(listener.logImpression.getCall(4).calledWithMatch({
        impression: {
          feature: 'whitelist',
          keyName: 'facundo@split.io',
          treatment: 'allowed',
          bucketingKey: undefined,
          label: 'default rule',
        },
        attributes: testAttrs,
        ...metaData
      }));

      client.destroy();
      assert.end();
    }, 0);
  });
}
