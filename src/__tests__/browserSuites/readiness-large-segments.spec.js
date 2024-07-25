import { SplitFactory } from '../../';

// Mocks
import mySegments from '../mocks/mysegments.nicolas@split.io.json';
import myLargeSegments from '../mocks/mylargesegments.employees.json';
import { nearlyEqual } from '../testUtils';

const FF = {
  name: 'FF',
  status: 'ACTIVE',
  conditions: [{
    matcherGroup: {
      combiner: 'AND',
      matchers: []
    }
  }]
};

const FF_WITH_SEGMENTS = {
  name: 'FF_WITH_SEGMENTS',
  status: 'ACTIVE',
  conditions: [{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'IN_SEGMENT',
        userDefinedSegmentMatcherData: {
          segmentName: 'A'
        }
      }]
    }
  }]
};

const FF_WITH_LARGE_SEGMENTS = {
  name: 'FF_WITH_LARGE_SEGMENTS',
  status: 'ACTIVE',
  conditions: [{
    matcherGroup: {
      combiner: 'AND',
      matchers: [{
        matcherType: 'IN_LARGE_SEGMENT',
        userDefinedSegmentMatcherData: {
          segmentName: 'A'
        }
      }]
    }
  }]
};

const waitConfig = {
  core: {
    authorizationKey: '<fake-token>',
    key: 'emi@split.io'
  },
  urls: {
    sdk: 'https://sdk.baseurl/largeSegments',
  },
  sync: {
    largeSegmentsEnabled: true
  },
  streamingEnabled: false
};

const noWaitConfig = {
  ...waitConfig,
  startup: {
    waitForLargeSegments: false
  }
};

const SEGMENTS_DELAY = 50;
const LARGE_SEGMENTS_DELAY = 100;
const TEST_END_DELAY = 150;

export default function (fetchMock, assert) {

  const testCases = [
    { waitForLargeSegments: true, featureFlagsWithSegments: true, featureFlagsWithLS: true },
    { waitForLargeSegments: true, featureFlagsWithSegments: true, featureFlagsWithLS: false },
    { waitForLargeSegments: true, featureFlagsWithSegments: false, featureFlagsWithLS: true },
    { waitForLargeSegments: true, featureFlagsWithSegments: false, featureFlagsWithLS: false },
    { waitForLargeSegments: false, featureFlagsWithSegments: true, featureFlagsWithLS: true },
    { waitForLargeSegments: false, featureFlagsWithSegments: true, featureFlagsWithLS: false },
    { waitForLargeSegments: false, featureFlagsWithSegments: false, featureFlagsWithLS: true },
    { waitForLargeSegments: false, featureFlagsWithSegments: false, featureFlagsWithLS: false },

    // Special cases where large segments are not supported for the given SDK key: `/myLargeSegments/*` responds with 403 and there cannot be FFs with large segments
    { waitForLargeSegments: true, featureFlagsWithSegments: true, featureFlagsWithLS: false, myLargeSegmentsForbidden: true },
    { waitForLargeSegments: false, featureFlagsWithSegments: true, featureFlagsWithLS: false, myLargeSegmentsForbidden: true },
  ];

  testCases.forEach(({ waitForLargeSegments, featureFlagsWithSegments, featureFlagsWithLS, myLargeSegmentsForbidden }) => {

    const config = waitForLargeSegments ? waitConfig : noWaitConfig;

    const splitChangesMock = {
      since: -1,
      till: 1457552620999,
      splits: [FF, featureFlagsWithSegments && FF_WITH_SEGMENTS, featureFlagsWithLS && FF_WITH_LARGE_SEGMENTS].filter(ff => ff)
    };

    // smart ready: if FFs are not using segments (or LS) we don't need to wait for them
    const SDK_READY_DELAY = Math.max(
      featureFlagsWithSegments ? SEGMENTS_DELAY : 0,
      featureFlagsWithLS && waitForLargeSegments ? LARGE_SEGMENTS_DELAY : 0
    );

    // emit SDK_UPDATE if large segments arrive after SDK_READY event is emitted and FFs are using them
    const shouldEmitSdkUpdate = waitForLargeSegments === false && featureFlagsWithLS === true && (LARGE_SEGMENTS_DELAY > SEGMENTS_DELAY || featureFlagsWithSegments === false);

    assert.test(t => {
      fetchMock.getOnce(config.urls.sdk + '/splitChanges?s=1.1&since=-1', { status: 200, body: splitChangesMock });
      fetchMock.getOnce(config.urls.sdk + '/splitChanges?s=1.1&since=1457552620999', { status: 200, body: { since: 1457552620999, till: 1457552620999, splits: [] } });
      fetchMock.getOnce(config.urls.sdk + '/mySegments/emi%40split.io', { status: 200, body: mySegments }, { delay: SEGMENTS_DELAY });
      fetchMock.getOnce(config.urls.sdk + '/myLargeSegments/emi%40split.io', { status: myLargeSegmentsForbidden ? 403 : 200, body: myLargeSegments }, { delay: LARGE_SEGMENTS_DELAY });

      // smart pausing: if FFs are not using segments (or LS) we don't need to fetch them
      if (featureFlagsWithSegments) fetchMock.getOnce(config.urls.sdk + '/mySegments/shared', { status: 200, body: mySegments }, { delay: SEGMENTS_DELAY });
      if (featureFlagsWithLS) fetchMock.getOnce(config.urls.sdk + '/myLargeSegments/shared', { status: myLargeSegmentsForbidden ? 403 : 200, body: myLargeSegments }, { delay: LARGE_SEGMENTS_DELAY });

      const splitio = SplitFactory(config);
      const client = splitio.client();

      const start = Date.now();
      client.once(client.Event.SDK_READY, () => {
        assert.true(nearlyEqual(Date.now() - start, SDK_READY_DELAY));

        splitio.client('shared').ready().then(() => {
          assert.true(nearlyEqual(Date.now() - start, 2 * SDK_READY_DELAY));
        });
      });

      let updateEmitted = false;

      client.once(client.Event.SDK_UPDATE, () => {
        assert.true(nearlyEqual(Date.now() - start, LARGE_SEGMENTS_DELAY));
        updateEmitted = true;
      });

      setTimeout(() => {
        assert.true(updateEmitted === shouldEmitSdkUpdate);
        client.destroy().then(() => { t.end(); });
      }, TEST_END_DELAY);
    });

  });

}
