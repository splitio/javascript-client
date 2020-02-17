export const DEFAULT_TRACKER = 't0';

const HIT_FIELDS = ['hitType', 'nonInteraction'];
const EVENT_FIELDS = ['eventCategory', 'eventAction', 'eventLabel', 'eventValue'];

/**
 * Spy ga hits per tracker.
 * 
 * @param {string[]} trackerNames names of the trackers to spy. If not provided, it spies the default tracker. i.e., `gaSpy()` is equivalent to `gaSpy(['t0'])`.
 * @param {string[]} fieldNames names of the hit fields to spy. If not provided, it spies hit and event related fields. i.e., 'hitType', 'nonInteraction',
 * 'eventCategory', 'eventAction', 'eventLabel', and 'eventValue', which are the ones set by default SplitToGa mapper.
 * 
 * @see {@link https://developers.google.com/analytics/devguides/collection/analyticsjs/field-reference}
 */
export function gaSpy(trackerNames = [DEFAULT_TRACKER], fieldNames = [...HIT_FIELDS, ...EVENT_FIELDS]) {

  const hits = {};

  window.ga = window[window['GoogleAnalyticsObject'] || 'ga'];

  if (typeof window.ga == 'function') {
    window.ga(function () {
      // We try-catch the following code, since errors are catched by `ga` and thus cannot be traced for debugging.
      try {
        trackerNames.forEach(trackerName => {
          const trackerToSniff = window.ga.getByName(trackerName);
          hits[trackerName] = [];
          var originalSendHitTask = trackerToSniff.get('sendHitTask');
          trackerToSniff.set('sendHitTask', function (model) {
            originalSendHitTask(model);
            const hit = {};
            fieldNames.forEach(fieldName => {
              hit[fieldName] = model.get(fieldName);
            });
            hits[trackerName].push(hit);
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
    // getHits may return `undefined` if `ga` is not ready or `trackerName` is not in the list of `trackerNames` 
    getHits: function (trackerName = DEFAULT_TRACKER) {
      const trackerHits = hits[trackerName];
      return trackerHits;
    }
  };

  return window.gaSpy;
}

/**
 * Add Google Analytics tag, removing previous one if exists.
 * @see {@link https://developers.google.com/analytics/devguides/collection/analyticsjs#the_google_analytics_tag}
 * 
 * @param {nuber} delayTagInsertionInMillis number of milliseconds to delay the tag insertion using a `setTimeout`
 */
export function gaTag(delayTagInsertionInMillis = -1) {

  // remove GA tag, in case a previous test has set it.
  window[window['GoogleAnalyticsObject'] || 'ga'] = undefined;

  // Add GA tag
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
    if (delayTagInsertionInMillis >= 0) {
      setTimeout(() => {
        m.parentNode.insertBefore(a, m);
      }, 2000);
    } else {
      m.parentNode.insertBefore(a, m);
    }
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
}
