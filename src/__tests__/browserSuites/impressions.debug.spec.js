import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import splitChangesMock2 from '../mocks/splitchanges.since.1457552620999.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
import { DEBUG } from '@splitsoftware/splitio-commons/src/utils/constants';
import { url } from '../testUtils';

const baseUrls = {
  sdk: 'https://sdk.baseurl/impressionsDebugSuite',
  events: 'https://events.baseurl/impressionsDebugSuite'
};

const settings = settingsFactory({
  core: {
    key: 'asd'
  },
  urls: baseUrls,
  streamingEnabled: false
});

export default function (fetchMock, assert) {
  // Mocking this specific route to make sure we only get the items we want to test from the handlers.
  fetchMock.getOnce(url(settings, '/splitChanges?s=1.1&since=-1'), { status: 200, body: splitChangesMock1 });
  fetchMock.get(url(settings, '/splitChanges?s=1.1&since=1457552620999'), { status: 200, body: splitChangesMock2 });
  fetchMock.get(url(settings, '/mySegments/facundo%40split.io'), { status: 200, body: mySegmentsFacundo });

  const splitio = SplitFactory({
    core: {
      authorizationKey: '<some-token>',
      key: 'facundo@split.io'
    },
    scheduler: {
      featuresRefreshRate: 0.5,
      segmentsRefreshRate: 0.5,
      impressionsRefreshRate: 3000,
      impressionsQueueSize: 3 // flush impressions when 3 are queued
    },
    startup: {
      eventsFirstPushWindow: 3000
    },
    urls: baseUrls,
    sync: {
      impressionsMode: DEBUG,
    },
    streamingEnabled: false
  });

  const client = splitio.client();
  const assertPayload = req => {
    const resp = JSON.parse(req.body);

    assert.equal(resp.length, 1, 'We performed three evaluations so we should have 1 impressions type');

    const alwaysOnWithConfigImpr = resp.filter(e => e.f === 'split_with_config')[0];

    assert.equal(alwaysOnWithConfigImpr.i.length, 3);

    function validateImpressionData(output, expected) {
      assert.equal(output.k, expected.keyName, 'Present impressions should have the correct key.');
      assert.equal(output.b, expected.bucketingKey, 'Present impressions should have the correct bucketingKey.');
      assert.equal(output.t, expected.treatment, 'Present impressions should have the correct treatment.');
      assert.equal(output.r, expected.label, 'Present impressions should have the correct label.');
      assert.equal(output.c, expected.changeNumber, 'Present impressions should have the correct changeNumber.');
      assert.equal(output.pt, expected.pt, 'Present impressions should have the correct previousTime.');
    }

    validateImpressionData(alwaysOnWithConfigImpr.i[0], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
      bucketingKey: undefined, changeNumber: 828282828282, pt: undefined
    });
    validateImpressionData(alwaysOnWithConfigImpr.i[1], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
      bucketingKey: undefined, changeNumber: 828282828282, pt: alwaysOnWithConfigImpr.i[0].m
    });
    validateImpressionData(alwaysOnWithConfigImpr.i[2], {
      keyName: 'facundo@split.io', label: 'another expected label', treatment: 'o.n',
      bucketingKey: undefined, changeNumber: 828282828282, pt: alwaysOnWithConfigImpr.i[1].m
    });
  };

  fetchMock.postOnce(url(settings, '/testImpressions/bulk'), (url, req) => {
    assert.equal(req.headers.SplitSDKImpressionsMode, DEBUG);
    assertPayload(req);

    client.destroy().then(() => {
      assert.end();
    });

    return 200;
  });

  client.ready().then(() => {
    client.getTreatment('split_with_config');
    client.getTreatment('split_with_config');
    client.getTreatment('split_with_config');
  });
}
