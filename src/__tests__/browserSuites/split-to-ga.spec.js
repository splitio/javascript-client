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

const DEFAULT_TRACKER = 't0';
/**
 * Spy ga hits per tracker.
 * 
 * @param {string[]} trackerNames names of the trackers to spy. If not provided, it spy the default tracker. i.e., `gaSpy()` is equivalent to `gaSpy(['t0'])`
 */
function gaSpy(trackerNames = [DEFAULT_TRACKER]) {

  window.gaSpy = (function () {

    const hits = {};

    // console.log(`gaSpy[${trackerName || 't0'}]::init`);
    var ga = window[window['GoogleAnalyticsObject'] || 'ga'];

    if (typeof ga == 'function') {
      ga(function (tracker) {
        trackerNames.forEach(trackerName => {
          const trackerToSniff = trackerName && trackerName !== DEFAULT_TRACKER ? ga.getByName(trackerName) : tracker;
          hits[trackerName] = [];
          var originalSendHitTask = trackerToSniff.get('sendHitTask');
          trackerToSniff.set('sendHitTask', function (model) {
            originalSendHitTask(model);
            // @TODO parse more fields
            hits[trackerName].push({ hitType: model.get('hitType') });
          });
        });
      });
    } else {
      console.error('GA command queue was not found');
    }

    return {
      getHits: function (trackerName = DEFAULT_TRACKER) {
        return hits[trackerName];
      }
    };
  })();

  return window.gaSpy;
}

function gaTag() {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date(); a = s.createElement(o), m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m);
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
}

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
      const resp = JSON.parse(req.data);
      const sentImpressions = countImpressions(resp);
      const sentHits = window.gaSpy.getHits();

      t.equal(sentImpressions + 1, sentHits.length, `Number of sent hits must be equal to the number of impressions plus 1 for the initial pageview (${resp.length + 1})`);

      client.destroy();
      t.end();
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
      client.getTreatmentWithConfig('split_with_config');
    });

  });

}
