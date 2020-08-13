import sinon from 'sinon';
import { SplitFactory } from '../../index';
import SettingsFactory from '../../utils/settings';
import { gaSpy, gaTag, addGaTag, removeGaTag } from './gaTestUtils';


const config = {
  core: {
    key: 'facundo@split.io',
    trafficType: 'user',
  },
  integrations: [{
    type: 'GOOGLE_ANALYTICS_TO_SPLIT',
  }],
  startup: {
    eventsFirstPushWindow: 0.2,
  },
  streamingEnabled: false
};
const settings = SettingsFactory(config);

export default function (fetchMock, assert) {

  let client;

  // test default behavior on default tracker
  assert.test(t => {
    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      const sentHits = window.gaSpy.getHits();

      t.equal(resp.length, sentHits.length, `Number of sent hits must be equal to sent events (${resp.length})`);
      t.equal(resp[0].key, settings.core.key, 'Event key is same that SDK config key');
      t.equal(resp[0].trafficTypeName, settings.core.trafficType, 'Event trafficTypeName is same that SDK config key');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return 200;
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

  // test default behavior on named tracker, tracking N events, and GA in a different global variable
  assert.test(t => {
    const numberOfCustomEvents = 5;
    let client;

    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      const sentHits = window.gaSpy.getHits('myTracker');

      t.equal(resp.length, sentHits.length, `Number of sent hits must be equal to sent events (${resp.length})`);
      t.equal(resp[0].key, settings.core.key, 'Event key is same that SDK config key');
      t.equal(resp[0].trafficTypeName, settings.core.trafficType, 'Event trafficTypeName is same that SDK config key');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return 200;
    });

    gaTag('other_location_for_ga');

    window.other_location_for_ga('create', 'UA-00000001-1', 'example1.com', 'myTracker', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker']);

    const factory = SplitFactory(config);
    client = factory.client();

    window.other_location_for_ga('myTracker.require', 'splitTracker');
    // this second 'require' is not applied (does not overwrite previous command)
    window.other_location_for_ga('myTracker.require', 'splitTracker', { mapper: function () { throw 'error'; } });

    for (let i = 0; i < numberOfCustomEvents; i++)
      window.other_location_for_ga('myTracker.send', 'pageview');

  });

  // test error: no TT in SDK config
  assert.test(t => {
    const numberOfCustomEvents = 5;

    gaTag();

    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy();

    const logSpy = sinon.spy(console, 'log');

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

      logSpy.restore();
      t.end();
    });

    factory.client().destroy();

  });

  // test default behavior, providing a list of identities as SDK options
  assert.test(t => {
    const numberOfCustomEvents = 3;
    const identities = [{ key: 'user1', trafficType: 'user' }, { key: 'user2', trafficType: 'user' }];
    let client;

    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      const sentHits = window.gaSpy.getHits('myTracker3');

      t.equal(sentHits.length, numberOfCustomEvents, `Number of sent hits must be equal to sent custom events (${numberOfCustomEvents})`);
      t.equal(resp.length, numberOfCustomEvents * identities.length, 'The number of sent events must be equal to the number of sent hits multiply by the number of identities');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return 200;
    });

    gaTag();

    window.ga('create', 'UA-00000003-1', 'example3.com', 'myTracker3', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker3']);

    const factory = SplitFactory({
      ...config,
      core: { key: config.core.key },
      integrations: [{
        type: 'GOOGLE_ANALYTICS_TO_SPLIT',
        identities: identities,
      }],
    });
    client = factory.client();

    window.ga('myTracker3.require', 'splitTracker');
    for (let i = 0; i < numberOfCustomEvents; i++)
      window.ga('myTracker3.send', 'pageview');

  });


  // test default behavior in multiple trackers, providing a list of identities in plugin options for one tracker and in sdk options for another
  assert.test(t => {
    const identitiesPluginOpts = [{ key: 'user1', trafficType: 'user' }, { key: 'user2', trafficType: 'user' }];
    const identitiesSdkOpts = [{ key: 'user3', trafficType: 'user' }];
    const gaSendIterations = 3;
    const expectedNumberOfSplitEvents = gaSendIterations * (identitiesPluginOpts.length + identitiesSdkOpts.length);

    let client;

    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      t.equal(resp.length, expectedNumberOfSplitEvents, 'The number of sent Split events must be equal to the number of sent hits multiply by the number of identities');

      const sentHitsTracker4 = window.gaSpy.getHits('myTracker4');
      const sentHitsTracker5 = window.gaSpy.getHits('myTracker5');

      t.equal(sentHitsTracker4.length, gaSendIterations, `Number of sent hits must be equal to the times 'send' command was invoked (${gaSendIterations})`);
      t.equal(sentHitsTracker5.length, gaSendIterations, `Number of sent hits must be equal to the times 'send' command was invoked (${gaSendIterations})`);

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return 200;
    });

    gaTag();

    window.ga('create', 'UA-00000004-1', 'example4.com', 'myTracker4', { siteSpeedSampleRate: 0 });
    window.ga('create', 'UA-00000005-1', 'example5.com', 'myTracker5', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker4', 'myTracker5']);

    const factory = SplitFactory({
      ...config,
      core: { key: config.core.key },
      integrations: [{
        type: 'GOOGLE_ANALYTICS_TO_SPLIT',
        identities: identitiesSdkOpts,
      }],
    });
    client = factory.client();

    window.ga('myTracker4.require', 'splitTracker', { identities: identitiesPluginOpts });
    window.ga('myTracker5.require', 'splitTracker');

    for (let i = 0; i < gaSendIterations; i++) {
      window.ga('myTracker4.send', 'pageview');
      window.ga('myTracker5.send', 'event', 'mycategory', 'myaction');
    }

  });

  // test custom filter and mapper in multiple trackers, passed as plugin options for one tracker and as sdk options for another
  assert.test(t => {
    const gaSendIterations = 3;
    const prefixPluginOpts = 'plugin';
    const prefixSdkOpts = 'sdk';

    let client;

    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      t.equal(resp.length, gaSendIterations * 2, 'The number of sent Split events must be equal to the number of no filtered sent hits');
      t.equal(resp.filter(event => event.eventTypeId === prefixSdkOpts + '.mapperSdkOpts').length, gaSendIterations, 'Custom Split events');
      t.equal(resp.filter(event => event.eventTypeId === prefixPluginOpts + '.mapperPluginOpts').length, gaSendIterations, 'Custom Split events');

      const sentHitsTracker4 = window.gaSpy.getHits('myTracker4');
      const sentHitsTracker5 = window.gaSpy.getHits('myTracker5');

      t.equal(sentHitsTracker4.length, gaSendIterations * 2, 'Number of sent hits must be equal to the times `send` command was invoked');
      t.equal(sentHitsTracker5.length, gaSendIterations * 2, 'Number of sent hits must be equal to the times `send` command was invoked');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return 200;
    });

    gaTag();

    window.ga('create', 'UA-00000004-1', 'example4.com', 'myTracker4', { siteSpeedSampleRate: 0 });
    window.ga('create', 'UA-00000005-1', 'example5.com', 'myTracker5', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker4', 'myTracker5']);

    const factory = SplitFactory({
      ...config,
      integrations: [{
        type: 'GOOGLE_ANALYTICS_TO_SPLIT',
        filter: model => model.get('hitType') === 'pageview', // accepts only pageviews
        mapper: () => ({ eventTypeId: 'mapperSdkOpts' }), // return a fixed event instance
        prefix: prefixSdkOpts,
      }],
    });
    client = factory.client();

    window.ga('myTracker4.require', 'splitTracker', {
      filter: model => model.get('hitType') === 'event', // accepts only events
      mapper: (model, defaultEvent) => ({ ...defaultEvent, eventTypeId: 'mapperPluginOpts' }), // updates the eventTypeId of default event
      prefix: prefixPluginOpts,
    });
    window.ga('myTracker5.require', 'splitTracker');

    for (let i = 0; i < gaSendIterations; i++) {
      window.ga('myTracker4.send', 'pageview');
      window.ga('myTracker5.send', 'pageview');
      window.ga('myTracker4.send', 'event', 'mycategory', 'myaction');
      window.ga('myTracker5.send', 'event', 'mycategory', 'myaction');
    }

  });

  // exception in custom mapper or invalid mapper result must not block sending hits
  assert.test(t => {
    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      t.equal(resp.length, 1, 'only a custom event is sent. no events associated to ga hit');
      return 200;
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });
    window.ga('create', 'UA-00000001-1', 'example1.com', 'myTracker', { siteSpeedSampleRate: 0 });

    gaSpy(['t0', 'myTracker']);

    window.ga('require', 'splitTracker', { mapper: function () { throw 'error'; } });
    // this second 'require' is not applied (it does not overwrite previous command)
    window.ga('require', 'splitTracker');

    window.ga('myTracker.require', 'splitTracker', { mapper: function () { return { value: 'invalid value' }; } });

    const logSpy = sinon.spy(console, 'log');

    window.ga('send', 'pageview');
    window.ga('myTracker.send', 'pageview');

    const factory = SplitFactory(config);
    client = factory.client();
    client.track('some_event');

    setTimeout(() => {
      const sentHitsT0 = window.gaSpy.getHits('t0');
      const sentHitsMyTracker = window.gaSpy.getHits('myTracker');
      t.equal(sentHitsT0.length, 1, 'Hits must be sent even if a custom mapper throw an exception');
      t.equal(sentHitsMyTracker.length, 1, 'Hits must be sent even if a custom mapper return an invalid event instance');
      t.ok(logSpy.calledWith('[ERROR] splitio-ga-to-split:mapper: value must be a finite number.'));
      client.destroy();
      logSpy.restore();
      t.end();
    });

  });

  // test default behavior on default tracker: Split ready before GA init, and keep sending hits after Split destroyed
  assert.test(t => {
    const hits = [{ hitType: 'pageview' }, { hitType: 'event' }];
    const hitsAfterDestroyed = [{ hitType: 'screenview' }];

    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      const sentHits = window.gaSpy.getHits();

      t.equal(resp.length, sentHits.length, `Number of sent hits must be equal to sent events (${hits.length})`);
      t.equal(resp.length, hits.length, `Number of sent hits must be equal to sent events (${hits.length})`);

      setTimeout(() => {
        client.destroy().then(() => {
          hitsAfterDestroyed.forEach(hit => window.ga('send', hit));
          setTimeout(() => {
            t.equal(sentHits.length, hits.length + hitsAfterDestroyed.length, 'sending hits must not be bloqued if Split SDK is destroyed');
            t.end();
          });
        });
      });
      return 200;
    });

    removeGaTag();

    const factory = SplitFactory({
      ...config,
      startup: {
        eventsFirstPushWindow: 1000,
      },
      scheduler: {
        eventsQueueSize: hits.length,
      }
    });
    client = factory.client();

    client.ready().then(() => {
      addGaTag();
      window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });
      gaSpy();

      window.ga('require', 'splitTracker');
      hits.forEach(hit => window.ga('send', hit));

    });
  });

  // test `hits` flag
  assert.test(t => {
    fetchMock.postOnce(settings.url('/events/bulk'), (url, opts) => {
      const resp = JSON.parse(opts.body);
      const sentHits = window.gaSpy.getHits();

      t.equal(resp.filter(event => event.eventTypeId === 'ga.pageview').length, 0, 'No events associated to GA hits must be sent');
      t.equal(resp.filter(event => event.eventTypeId === 'some_event').length, 1, 'Tracked events must be sent to Split');
      t.equal(sentHits.length, 1, 'Hits must be sent to GA');

      setTimeout(() => {
        client.destroy();
        t.end();
      });
      return 200;
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy();

    window.ga('require', 'splitTracker', { hits: false });
    window.ga('send', 'pageview');

    const factory = SplitFactory(config);
    client = factory.client();
    client.track('some_event');

  });

}