import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

function gaSpy() {
  window.gaSpy = (function () {

    const hits = [];

    function getHits() {
      return hits;
    }

    function init(trackerName) {
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
    }

    return {
      init,
      getHits
    };

  })();
}

function gaTag() {
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
      (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date(); a = s.createElement(o),
    m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m);
  })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
}


const settings = SettingsFactory({
  core: {
    key: 'facundo@split.io'
  },
  integrations: {
    ga2split: true,
  },
  scheduler: {
    eventsQueueSize: 2,
  },
});

export function defaultBehavior(mock, assert) {

  mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
    const resp = JSON.parse(req.data);

    assert.equal(resp.length, window.gaSpy.getHits().length, 'Number of sent hits must be equal to sent events');

    assert.end();
    return [200];
  });

  gaTag();
  gaSpy();


  window.ga('create', 'UA-16697845-1', 'auto', { sampleRate: 100, siteSpeedSampleRate: 100 });
  window.gaSpy.init();
  window.ga('require', 'splitTracker'), {
    hitFilter: function (model) {
      console.log('hit: ' + model.get('hitType'));
      return true;
    },
  };
  window.ga('send', 'pageview');

  // eslint-disable-next-line no-unused-vars
  const factory = SplitFactory(settings);

}
