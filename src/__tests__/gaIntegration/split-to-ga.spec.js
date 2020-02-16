/**
 * -split-to-ga tests:
 *  - Default behavior
 *    DONE- No hits are sent if no getTreatment is invoked
 *    DONE- N hits are sent if getTreatment called N times
 * 
 *  - Configs
 *    DONE- Several tracker names with the same filter and mapper
 *    DONE- Several tracker names with different filters and mappers
 *    DONE- Custom filter
 *    DONE- Custom mapper
 * 
 *  - Error/Corner cases
 *    -SDK errors.
 *      NO NEED: IGNORED BY GA- invalid trackerNames
 *      - filter or mapper with exception or invalid: log warning ERROR IN QUEUE
 *    
 *    - SDK factory instantiated before than
 *      - GA tag: log warning
 *      - a new tracker is created: check that some hits are missed
 *    - GA tag not included, but SDK configured for Split-to-GA: log warning NO GA FOUND
 *    ?- GA in another global variable
 *    - SDK loaded, evaluated and destroyed before GA loaded: log warning NO GA FOUND
 *    
 *  - Node:
 *    - Should do nothing
 */

import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import splitChangesMock1 from '../mocks/splitchanges.since.-1.json';
import mySegmentsFacundo from '../mocks/mysegments.facundo@split.io.json';
import { gaSpy, gaTag } from './gaTestUtils';
import { SPLIT_IMPRESSION, SPLIT_EVENT } from '../../utils/constants';

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
  integrations: [{
    type: 'SPLIT_TO_GA',
  }],
  scheduler: {
    impressionsRefreshRate: 0.5,
    eventsQueueSize: 1,
  },
};

const settings = SettingsFactory(config);

export default function (mock, assert) {

  mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
  mock.onGet(settings.url('/mySegments/facundo@split.io')).reply(200, mySegmentsFacundo);

  // test default behavior
  assert.test(t => {

    let client;

    // Generator to synchronize the call of t.end() when both impressions and events endpoints were invoked.
    const finish = (function* () {
      yield;
      t.equal(window.gaSpy.getHits().length, 3, 'Total hits are 3: pageview, split event and impression');
      setTimeout(() => {
        client.destroy();
        t.end();
      });
    })();

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      // we can assert payload and ga hits, once ga is ready.
      window.ga(() => {
        const resp = JSON.parse(req.data);
        const sentImpressions = countImpressions(resp);
        const sentImpressionHits = window.gaSpy.getHits().filter(hit => hit.eventCategory === 'split-impression');

        t.equal(sentImpressions, 1, 'Number of impressions');
        t.equal(sentImpressions, sentImpressionHits.length, `Number of sent impression hits must be equal to the number of impressions (${sentImpressions})`);

        finish.next();
      });
      return [200];
    });

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      window.ga(() => {
        const resp = JSON.parse(req.data);
        const sentEvents = resp.length;
        const sentEventHits = window.gaSpy.getHits().filter(hit => hit.eventCategory === 'split-event');

        t.equal(sentEvents, 1, 'Number of events');
        t.equal(sentEvents, sentEventHits.length, `Number of sent event hits must be equal to sent events: (${sentEvents})`);

        finish.next();
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
      client.track('some_event');
      client.getTreatment('hierarchical_splits_test');
    });

  });

  // test default behavior in multiple trackers and multiple impressions
  assert.test(t => {

    let client;
    const numOfEvaluations = 4;

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      window.ga(() => {
        const resp = JSON.parse(req.data);
        const sentImpressions = countImpressions(resp);
        const sentHitsTracker1 = window.gaSpy.getHits('myTracker1');
        const sentHitsTracker2 = window.gaSpy.getHits('myTracker2');

        t.equal(sentImpressions, numOfEvaluations, 'Number of impressions equals the number of evaluations');
        t.equal(sentImpressions, sentHitsTracker1.length, 'Number of sent hits must be equal to the number of impressions');
        t.equal(sentImpressions, sentHitsTracker2.length, 'Number of sent hits must be equal to the number of impressions');

        setTimeout(() => {
          client.destroy();
          t.end();
        });
      });
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
      integrations: [{
        type: 'SPLIT_TO_GA',
        trackerNames: ['myTracker1'],
      }, {
        type: 'SPLIT_TO_GA',
        trackerNames: ['myTracker2'],
      }],
    });
    client = factory.client();
    client.ready().then(() => {
      for (let i = 0; i < numOfEvaluations; i++)
        client.getTreatment('split_with_config');
    });

  });

  // test several SplitToGa integration items, with custom filter and mapper
  assert.test(t => {

    let client;
    const numOfEvaluations = 4;
    const numOfEvents = 3;

    // Generator to synchronize the call of t.end() when both impressions and events endpoints were invoked.
    const finish = (function* () {
      yield;
      setTimeout(() => {
        client.destroy();
        t.end();
      });
    })();

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      window.ga(() => {
        const resp = JSON.parse(req.data);
        const sentImpressions = countImpressions(resp);
        const sentImpressionHitsTracker3 = window.gaSpy.getHits('myTracker3').filter(hit => hit.eventCategory === 'split-impression');
        const sentImpressionHitsTracker4 = window.gaSpy.getHits('myTracker4').filter(hit => hit.eventCategory === 'split-impression');

        t.equal(sentImpressionHitsTracker3.length, sentImpressions, 'For tracker3, no impressions are filtered');
        t.equal(sentImpressionHitsTracker4.length, 0, 'For tracker4, all impressions are filtered');

        finish.next();
      });
      return [200];
    });

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      window.ga(() => {
        const resp = JSON.parse(req.data);
        const sentEvents = resp.length;
        const sentEventHitsTracker3 = window.gaSpy.getHits('myTracker3').filter(hit => hit.eventCategory === 'mycategory');
        const sentEventHitsTracker4 = window.gaSpy.getHits('myTracker4').filter(hit => hit.eventCategory === 'mycategory');

        t.equal(sentEventHitsTracker3.length, 0, 'For tracker3, all events are filtered');
        t.equal(sentEventHitsTracker4.length, sentEvents, 'For tracker4, no events are filtered');

        finish.next();
      });
      return [200];
    });

    gaTag();

    window.ga('create', 'UA-00000003-1', 'example3.com', 'myTracker3', { siteSpeedSampleRate: 0 });
    window.ga('create', 'UA-00000004-1', 'example4.com', 'myTracker4', { siteSpeedSampleRate: 0 });

    gaSpy(['myTracker3', 'myTracker4']);

    const onlyImpressionsFilter = ({ type }) => type === SPLIT_IMPRESSION;
    const onlyEventsMapper = function ({ payload, type }) {
      return type === SPLIT_EVENT ?
        { hitType: 'event', eventCategory: 'mycategory', eventAction: payload.eventTypeId } :
        undefined;
    };
    const factory = SplitFactory({
      ...config,
      core: {
        ...config.core,
        authorizationKey: '<some-token-2>',
      },
      scheduler: {
        impressionsRefreshRate: 0.5,
        eventsQueueSize: numOfEvents,
      },
      integrations: [{
        type: 'SPLIT_TO_GA',
        trackerNames: ['myTracker3'],
        filter: onlyImpressionsFilter,
      }, {
        type: 'SPLIT_TO_GA',
        trackerNames: ['myTracker4'],
        mapper: onlyEventsMapper,
      }],
    });
    client = factory.client();
    client.ready().then(() => {
      for (let i = 0; i < numOfEvaluations; i++) {
        client.getTreatment('split_with_config');
      }
      for (let i = 0; i < numOfEvents; i++) {
        client.track('eventType');
      }
    });

  });
}