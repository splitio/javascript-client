/**
 * -ga-to-split tests:
 *  - Default behavior
 *    DONE- On default tracker
 *    DONE- On named tracker
 * 
 *  - Configs
 *    DONE- Several identities
 *      DONE- as plugin options
 *      DONE- as SDK options
 *    - Custom hitFilter
 *      - as plugin options
 *      - as SDK options
 *    - Custom hitMapper
 *      - as plugin options
 *      - as SDK options
 * 
 *  - Error/Corner cases
 *    -SDK errors. We must provide the plugin anyway, to not block ga command queue
 *      DONE- No identities or TT in SDK config
 *      - invalid identities
 *      - invalid hitFilter
 *      - invalid hitMapper
 *    - SDK factory instantiated before than GA tag
 *    - GA tag not included, but SDK configured for GA 
 *    - GA in another global variable
 *  
 *  - Node:
 *    - Should do nothing
 */

import sinon from 'sinon';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

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
    eventsQueueSize: 1,
  },
});

export default function (mock, assert) {

  let client;

  // test default behavior on default tracker
  assert.test(t => {
    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentEvents = window.gaSpy.getHits();

      t.equal(resp.length, sentEvents.length, `Number of sent hits must be equal to sent events: (${sentEvents.length})`);
      t.equal(resp[0].key, settings.core.key, 'Event key is same that SDK config key');
      t.equal(resp[0].trafficTypeName, settings.core.trafficType, 'Event trafficTypeName is same that SDK config key');

      client.destroy();
      t.end();
      return [200];
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy('t0');

    window.ga('require', 'splitTracker');
    window.ga('send', 'pageview');

    const factory = SplitFactory(settings);
    client = factory.client();

  });

  // test default behavior on named tracker, tracking N events
  assert.test(t => {
    const numberOfCustomEvents = 5;
    let client;

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentEvents = window.gaSpy.getHits();

      t.equal(resp.length, sentEvents.length, `Number of sent hits must be equal to sent events: (${sentEvents.length})`);
      t.equal(resp[0].key, settings.core.key, 'Event key is same that SDK config key');
      t.equal(resp[0].trafficTypeName, settings.core.trafficType, 'Event trafficTypeName is same that SDK config key');

      client.destroy();
      t.end();
      return [200];
    });

    // gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000001-1', 'example.com', 'myTracker', { siteSpeedSampleRate: 0 });

    gaSpy('myTracker');

    const factory = SplitFactory({
      ...settings, scheduler: {
        eventsQueueSize: numberOfCustomEvents,
      }
    });
    client = factory.client();

    window.ga('myTracker.require', 'splitTracker');
    for (let i = 0; i < numberOfCustomEvents; i++)
      window.ga('myTracker.send', 'pageview');

  });

  // test error: no TT in SDK config
  assert.test(t => {
    const numberOfCustomEvents = 5;
    const logSpy = sinon.spy(console, 'log');

    // mock.onPost(settings.url('/events/bulk')).replyOnce(() => {
    //   t.fail('Event endpoint should not be called if the plugin was not initialized properly');
    //   t.end();
    //   return [200];
    // });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000002-1', 'example.com', 'myTracker2', { siteSpeedSampleRate: 0 });

    gaSpy('myTracker2');

    const factory = SplitFactory({
      ...settings, core: { key: settings.core.key }, debug: true, scheduler: {
        eventsQueueSize: 1,
      }
    });

    window.ga('myTracker2.require', 'splitTracker');
    for (let i = 0; i < numberOfCustomEvents; i++)
      window.ga('myTracker2.send', 'pageview');

    t.ok(logSpy.calledWith('[ERROR] splitio: GA integration => A traffic type is required for tracking GA hits as Split events'));
    t.equal(window.gaSpy.getHits().length, numberOfCustomEvents, `Number of sent hits must be equal to ${numberOfCustomEvents}`);

    factory.client().destroy();

    t.end();
  });

  // test default behavior, providing a list of identities as SDK options
  assert.test(t => {
    const numberOfCustomEvents = 3;
    const identities = [{ key: 'user1', trafficType: 'user' }, { key: 'user2', trafficType: 'user' }];
    let client;

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentEvents = window.gaSpy.getHits();

      t.equal(sentEvents.length, numberOfCustomEvents, `Number of sent hits must be equal to sent custom events: (${numberOfCustomEvents})`);
      t.equal(resp.length, numberOfCustomEvents * identities.length, 'The number of sent events must be equal to the number of sent hits multiply by the number of identities');

      client.destroy();
      t.end();
      return [200];
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000003-1', 'example.com', 'myTracker3', { siteSpeedSampleRate: 0 });

    gaSpy('myTracker3');

    const factory = SplitFactory({
      ...settings, core: { key: settings.core.key },
      scheduler: {
        eventsQueueSize: numberOfCustomEvents * identities.length,
      },
      integrations: {
        ga2split: { identities },
      },
    });
    client = factory.client();

    window.ga('myTracker3.require', 'splitTracker');
    for (let i = 0; i < numberOfCustomEvents; i++)
      window.ga('myTracker3.send', 'pageview');

  });


  // test default behavior, providing a list of identities as plugin options
  assert.test(t => {
    const numberOfCustomEvents = 3;
    const identities = [{ key: 'user1', trafficType: 'user' }, { key: 'user2', trafficType: 'user' }];
    let client;

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentEvents = window.gaSpy.getHits();

      t.equal(sentEvents.length, numberOfCustomEvents, `Number of sent hits must be equal to sent custom events: (${numberOfCustomEvents})`);
      t.equal(resp.length, numberOfCustomEvents * identities.length, 'The number of sent events must be equal to the number of sent hits multiply by the number of identities');

      client.destroy();
      t.end();
      return [200];
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000004-1', 'example.com', 'myTracker4', { siteSpeedSampleRate: 0 });

    gaSpy('myTracker4');

    const factory = SplitFactory({
      ...settings, core: { key: settings.core.key },
      scheduler: {
        eventsQueueSize: numberOfCustomEvents * identities.length,
      },
    });
    client = factory.client();

    window.ga('myTracker4.require', 'splitTracker', { identities });
    for (let i = 0; i < numberOfCustomEvents; i++)
      window.ga('myTracker4.send', 'pageview');

  });

}
