/**
 * -split-to-ga tests:
 *  - Default behavior
 *    - No hits are sent if no getTreatment is invoked
 *    - N hits are sent if getTreatment called N times
 * 
 *  - Configs
 *    - Several tracker names
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

/**
 * Spy ga hits per tracker.
 * 
 * @param {string} trackerName name of the tracker to spy. If not provided, it spy the default tracker. i.e., `gaSpy()` is equivalent to `gaSpy('t0')`
 */
function gaSpy(trackerName) {
  window.gaSpy = (function () {

    const hits = [];

    console.log(`gaSpy[${trackerName || 't0'}]::init`);
    var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
    if (typeof ga == 'function') {
      ga(function (tracker) {
        const trackerToSniff = trackerName && trackerName !== 't0' ? ga.getByName(trackerName) : tracker;
        var originalSendHitTask = trackerToSniff.get('sendHitTask');
        trackerToSniff.set('sendHitTask', function (model) {
          originalSendHitTask(model);
          console.dir(model);
          hits.push({ hitType: model.get('hitType') });
        });
      });
    } else {
      console.error('GA command queue was not found');
    }

    return {
      getHits: function () {
        return hits;
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

  // test default behavior
  assert.test(t => {

    mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
    mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);

    let client;

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentHits = window.gaSpy.getHits();

      t.equal(resp.length + 1, sentHits.length, `Number of sent hits must be equal to the number of impressions +1 for the initial pageview (${resp.length + 1})`);

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
      t.equal(client.getTreatment('hierarchical_splits_test'), 'on', 'We should get an evaluation as always.');
    });

  });

}
