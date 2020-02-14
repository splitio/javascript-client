/**
 * -ga-to-split tests:
 *  - Default behavior
 *    DONE- On default tracker
 *    DONE- On named tracker
 *    -ga require on multiple trackers, with different options
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
 *    - Exception in filter or mapper, should not block sending the hit to GA
 *    - ga require command added repeatedly
 *    - SDK factory instantiated before than GA tag
 *    - SDK factory destroyed and GA keep sending hits
 *    - GA tag not included, but SDK configured for GA 
 *    - GA in another global variable
 *  
 *  -Test ga-to-split and split-to-ga together
 * 
 *  - Node:
 *    - Should do nothing
 */

import sinon from 'sinon';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import { gaSpy, gaTag } from '../utils/gaTestUtils';

const config = {
  core: {
    key: 'facundo@split.io',
    trafficType: 'user',
  },
  integrations: [{
    type: 'GA_TO_SPLIT',
  }],
  scheduler: {
    eventsQueueSize: 1,
  },
};
const settings = SettingsFactory(config);

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

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return [200];
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy();

    window.ga('require', 'splitTracker');
    window.ga('send', 'pageview');

    const factory = SplitFactory(config);
    client = factory.client();

  });

  // test default behavior on named tracker, tracking N events
  assert.test(t => {
    const numberOfCustomEvents = 5;
    let client;

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentEvents = window.gaSpy.getHits('myTracker');

      t.equal(resp.length, sentEvents.length, `Number of sent hits must be equal to sent events: (${sentEvents.length})`);
      t.equal(resp[0].key, settings.core.key, 'Event key is same that SDK config key');
      t.equal(resp[0].trafficTypeName, settings.core.trafficType, 'Event trafficTypeName is same that SDK config key');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return [200];
    });

    gaTag();

    window.ga('create', 'UA-00000001-1', 'example1.com', 'myTracker', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker']);

    const factory = SplitFactory({
      ...config,
      scheduler: {
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

    gaTag();

    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy();

    const factory = SplitFactory({
      ...config,
      core: { key: config.core.key },
      debug: true,
    });

    window.ga('require', 'splitTracker');
    for (let i = 0; i < numberOfCustomEvents; i++)
      window.ga('send', 'pageview');

    // We must wait until ga is ready to get SplitTracker required and invoked, and to assert the test
    window.ga(() => {
      t.ok(logSpy.calledWith('[WARN]  splitio-ga-to-split => No valid identities were provided. Please check that you are passing a valid list of identities or providing a traffic type at the SDK configuration.'));
      t.equal(window.gaSpy.getHits().length, numberOfCustomEvents, `Number of sent hits must be equal to ${numberOfCustomEvents}`);
      t.end();
    });

    factory.client().destroy();

  });

  // test default behavior, providing a list of identities as SDK options
  assert.test(t => {
    const numberOfCustomEvents = 3;
    const identities = [{ key: 'user1', trafficType: 'user' }, { key: 'user2', trafficType: 'user' }];
    let client;

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      const resp = JSON.parse(req.data);
      const sentEvents = window.gaSpy.getHits('myTracker3');

      t.equal(sentEvents.length, numberOfCustomEvents, `Number of sent hits must be equal to sent custom events: (${numberOfCustomEvents})`);
      t.equal(resp.length, numberOfCustomEvents * identities.length, 'The number of sent events must be equal to the number of sent hits multiply by the number of identities');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return [200];
    });

    gaTag();

    window.ga('create', 'UA-00000003-1', 'example3.com', 'myTracker3', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker3']);

    const factory = SplitFactory({
      ...config,
      core: { key: config.core.key },
      scheduler: {
        eventsQueueSize: numberOfCustomEvents * identities.length,
      },
      integrations: [{
        type: 'GA_TO_SPLIT',
        identities: identities,
      }],
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
      const sentEvents = window.gaSpy.getHits('myTracker4');

      t.equal(sentEvents.length, numberOfCustomEvents, `Number of sent hits must be equal to sent custom events: (${numberOfCustomEvents})`);
      t.equal(resp.length, numberOfCustomEvents * identities.length, 'The number of sent events must be equal to the number of sent hits multiply by the number of identities');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return [200];
    });

    gaTag();

    window.ga('create', 'UA-00000004-1', 'example4.com', 'myTracker4', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker4']);

    const factory = SplitFactory({
      ...config,
      core: { key: config.core.key },
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