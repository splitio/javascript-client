import sinon from 'sinon';
import { SplitFactory } from '../../index';
import { settingsValidator } from '../../settings';

const settings = settingsValidator({
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
    authorizationKey: '<fake-token-3>',
    key: 'nicolas@split.io'
  },
  scheduler: {
    featuresRefreshRate: 1,
    segmentsRefreshRate: 1,
    impressionsRefreshRate: 3000
  },
  startup: {
    eventsFirstPushWindow: 3000
  },
  impressionListener: listener,
  streamingEnabled: false
};

export default function(assert) {
  const splitio = SplitFactory(config);
  const client = splitio.client();
  const client2 = splitio.client({ matchingKey: 'marcio@split.io', bucketingKey: 'impr_bucketing_2' });
  const client3 = splitio.client('facundo@split.io');

  return client.ready().then(() => {
    const metaData = {
      ip: settings.runtime.ip,
      hostname: settings.runtime.hostname,
      sdkLanguageVersion: settings.version
    };
    const testAttrs = { is_test: true };

    // Impression listener is shared across all client instances and does not get affected by configurations.
    client.getTreatment('hierarchical_splits_test');
    client2.getTreatment('qc_team');
    client2.getTreatmentWithConfig('qc_team'); // Validate that the impression is the same.
    client3.getTreatment('qc_team', testAttrs);

    setTimeout(() => {
      const secondImpression = {
        feature: 'qc_team',
        keyName: 'marcio@split.io',
        treatment: 'no',
        bucketingKey: 'impr_bucketing_2',
        label: 'default rule'
      };

      assert.equal(listener.logImpression.callCount, 4, 'Impression listener logImpression method should be called after we call client.getTreatment, once per each impression generated.');
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
        impression: secondImpression,
        attributes: undefined,
        ...metaData
      }));
      assert.true(listener.logImpression.getCall(2).calledWithMatch({
        impression: Object.assign(secondImpression, { pt: listener.logImpression.getCall(1).lastArg.impression.time }),
        attributes: undefined,
        ...metaData
      }));
      assert.true(listener.logImpression.getCall(3).calledWithMatch({
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

      client3.destroy();
      client2.destroy();
      client.destroy();
      assert.end();
    }, 0);
  });
}
