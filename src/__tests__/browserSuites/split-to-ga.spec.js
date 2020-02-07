/**
 * -split-to-ga tests:
 *  - Default behavior
 *    - No hits are sent if no getTreatment is invoked
 *    DONE- N hits are sent if getTreatment called N times
 * 
 *  - Configs
 *    - Several tracker names with the same filter and mapper
 *    - Several tracker names with different filters and mappers
 *    - Custom impressionFilter
 *    - Custom impressionMapper
 * 
 *  - Error/Corner cases
 *    -SDK errors.
 *      - invalid trackerNames
 *      - invalid impressionFilter
 *      - invalid impressionMapper
 *    - SDK factory instantiated before than
 *      - GA tag
 *      - a new tracker is created
 *    - GA tag not included, but SDK configured for Split-to-GA 
 *    - GA in another global variable
 *    - SDK loaded, evaluated and destroyed before GA loaded
 *    
 *  - Node:
 *    - Should do nothing
 */

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
import { gaSpy, gaTag } from '../utils/gaTestUtils';




function countImpressions(parsedImpressionsBulkPayload) {
  return parsedImpressionsBulkPayload
    .reduce((accumulator, currentValue) => { return accumulator + currentValue.keyImpressions.length; }, 0);
}

const config = {
  core: {
    authorizationKey: '<some-token>',
    key: 'facundo@split.io',
    trafficType: 'user',
  },
  integrations: {
    split2ga: true,
  },
  scheduler: {
    impressionsRefreshRate: 0.5,
  },
};

const settings = SettingsFactory(config);

export default function (mock, assert) {

  mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);

  // test default behavior
  assert.test(t => {

    let client;

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      // we can assert payload and ga hits, once ga is ready.
      window.ga(() => {
        const resp = JSON.parse(req.data);
        const sentImpressions = countImpressions(resp);
        const sentHits = window.gaSpy.getHits();

        t.equal(sentImpressions, 1, 'Number of impressions');
        t.equal(sentImpressions + 1, sentHits.length, `Number of sent hits must be equal to the number of impressions plus 1 for the initial pageview (${resp.length + 1})`);

        setTimeout(() => {
          client.destroy();
          t.end();
        });
      });
      return [200];
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy();

    window.ga('send', 'pageview');

    const factory = SplitFactory(config);
    client = factory.client();
    client.ready().then(() => {
      client.getTreatment('hierarchical_splits_test');
    });

  });

  // test default behavior in multiple trackers
  assert.test(t => {

    let client;

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      // we can assert payload and ga hits, once ga is ready.
      // window.ga(() => {
      const resp = JSON.parse(req.data);
      const sentImpressions = countImpressions(resp);
      const sentHitsTracker1 = window.gaSpy.getHits('myTracker1');
      const sentHitsTracker2 = window.gaSpy.getHits('myTracker2');

      t.equal(sentImpressions, 1, 'Number of impressions');
      t.equal(sentImpressions, sentHitsTracker1.length, 'Number of sent hits must be equal to the number of impressions');
      t.equal(sentImpressions, sentHitsTracker2.length, 'Number of sent hits must be equal to the number of impressions');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      // });
      return [200];
    });

    gaTag();

    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });
    window.ga('create', 'UA-00000001-1', 'example1.com', 'myTracker1', { siteSpeedSampleRate: 0 });
    window.ga('create', 'UA-00000002-1', 'example2.com', 'myTracker2', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker1', 'myTracker2']);

    const factory = SplitFactory({
      ...config,
      core: {
        ...config.core,
        authorizationKey: '<some-token-2>',
      },
      integrations: {
        split2ga: [{
          trackerNames: ['myTracker1'],
        }, {
          trackerNames: ['myTracker2'],
        }],
      },
    });
    client = factory.client();
    client.ready().then(() => {
      client.getTreatment('split_with_config');
    });

  });

}
