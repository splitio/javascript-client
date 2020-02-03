/**
 * -ga-to-split tests:
 *  - Default behavior
 *  - Configs
 *    - Several identities
 *    - Custom hitFilter
 *    - Custom hitMapper
 *  - Corner cases
 *    - Provide plugin even if Split factory fails to initiate or have a bad config
 *    - Split factory instantiated before than GA tag
 *    - GA tag not included, but Split config configured for GA 
 */

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

function gaSpy(trackerName) {
  window.gaSpy = (function () {

    const hits = [];

    console.log('gaSpy::init');
    var ga = window[window['GoogleAnalyticsObject'] || 'ga'];
    if (typeof ga == 'function') {
      ga(function (tracker) {
        const trackerToSniff = trackerName ? ga.getByName(trackerName) : tracker;
        var originalSendHitTask = trackerToSniff.get('sendHitTask');
        trackerToSniff.set('sendHitTask', function (model) {
          originalSendHitTask(model);
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


const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io',
    trafficType: 'user',
  },
  integrations: {
    ga2split: true,
  },
  scheduler: {
    eventsQueueSize: 2,
  },
});

export default function (mock, assert) {

  // test default behavior 
  assert.test(t => {
    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);

      t.equal(resp.length, window.gaSpy.getHits().length, 'Number of sent hits must be equal to sent events');

      t.end();
      return [200];
    });

    gaTag();

    window.ga('create', 'UA-00000000-1', 'auto', { sampleRate: 100, siteSpeedSampleRate: 100 });

    gaSpy();

    window.ga('require', 'splitTracker');
    window.ga('send', 'pageview');

    SplitFactory(settings);

  });

}
