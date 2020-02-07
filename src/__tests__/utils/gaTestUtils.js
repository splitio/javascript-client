export const DEFAULT_TRACKER = 't0';

/**
 * Spy ga hits per tracker.
 * 
 * @param {string[]} trackerNames names of the trackers to spy. If not provided, it spy the default tracker. i.e., `gaSpy()` is equivalent to `gaSpy(['t0'])`
 */
export function gaSpy(trackerNames = [DEFAULT_TRACKER]) {

  const hits = {};

  window.ga = window[window['GoogleAnalyticsObject'] || 'ga'];

  if (typeof window.ga == 'function') {
    window.ga(function () {
      // We try - catch the following code, since errors are ignored by `ga` and thus not printed in console.
      try {
        trackerNames.forEach(trackerName => {
          const trackerToSniff = window.ga.getByName(trackerName);
          hits[trackerName] = [];
          var originalSendHitTask = trackerToSniff.get('sendHitTask');
          trackerToSniff.set('sendHitTask', function (model) {
            originalSendHitTask(model);
            // @TODO parse more fields
            hits[trackerName].push({ hitType: model.get('hitType') });
          });
        });
      } catch (err) {
        console.log(err);
      }
    });
  } else {
    console.error('GA command queue was not found');
  }

  window.gaSpy = {
    getHits: function (trackerName = DEFAULT_TRACKER) {
      const trackerHits = hits[trackerName];
      return trackerHits;
    }
  };

  return window.gaSpy;
}

/**
 * Google Analytics tag
 * @see {@link https://developers.google.com/analytics/devguides/collection/analyticsjs#the_google_analytics_tag}
 * 
 * @param {*} delayTagInsertionInMillis 
 */
export function gaTag(delayTagInsertionInMillis = -1) {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    },
    i[r].l = 1 * new Date();
    a = s.createElement(o),
    m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    if(delayTagInsertionInMillis >= 0) {
      setTimeout(() => {
        m.parentNode.insertBefore(a, m);
      }, 2000);
    } else {
      m.parentNode.insertBefore(a, m);
    }
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
}