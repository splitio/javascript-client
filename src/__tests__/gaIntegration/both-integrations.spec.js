import { SplitFactory } from '../..';
import SettingsFactory from '../../utils/settings';
import { gaSpy, gaTag } from './gaTestUtils';
import includes from 'lodash/includes';

function countImpressions(parsedImpressionsBulkPayload) {
  return parsedImpressionsBulkPayload
    .reduce((accumulator, currentValue) => { return accumulator + currentValue.keyImpressions.length; }, 0);
}

const config = {
  core: {
    key: 'facundo@split.io',
    trafficType: 'user',
  },
  integrations: [{
    type: 'GOOGLE_ANALYTICS_TO_SPLIT',
  }, {
    type: 'SPLIT_TO_GOOGLE_ANALYTICS',
  }],
  urls: {
    sdk: 'https://sdk.both-integrations.io/api',
    events: 'https://events.both-integrations.io/api'
  },
};
const settings = SettingsFactory(config);

export default function (mock, assert) {

  let client;

  // test default behavior of both integrations
  assert.test(t => {
    const customHits = [{ hitType: 'pageview' }, { hitType: 'event' }];

    const splitTrackParams = [['some_event'], ['other_event'], ['another_event']];
    const splitGetTreatmentParams = [['hierarchical_splits_test']];

    // Generator to synchronize the call of t.end() when both impressions and events endpoints were invoked.
    const finish = (function* () {
      yield;
      const totalHits = customHits.length + splitTrackParams.length + splitGetTreatmentParams.length;

      t.equal(window.gaSpy.getHits().length, totalHits, 'Total hits');
      setTimeout(() => {
        client.destroy();
        t.end();
      }, 0);
    })();

    mock.onPost(settings.url('/testImpressions/bulk')).replyOnce(req => {
      // we can assert payload and ga hits, once ga is ready and after `SplitToGa.queue`, that is timeout wrapped, make to the queue stack.
      window.ga(() => {
        setTimeout(() => {
          try {
            const resp = JSON.parse(req.data);
            const numberOfSentImpressions = countImpressions(resp);
            const sentImpressionHits = window.gaSpy.getHits().filter(hit => hit.eventCategory === 'split-impression');

            t.equal(numberOfSentImpressions, splitGetTreatmentParams.length, 'Number of impressions');
            t.equal(sentImpressionHits.length, splitGetTreatmentParams.length, `Number of sent impression hits must be equal to the number of impressions (${splitGetTreatmentParams.length})`);

            finish.next();
          } catch (err) {
            console.error(err);
          }
        });
      });
      return [200];
    });

    mock.onPost(settings.url('/events/bulk')).replyOnce(req => {
      window.ga(() => {
        setTimeout(() => {
          try {
            const sentEvents = JSON.parse(req.data);
            const sentEventsFromSplitToGa = sentEvents.filter(event => {
              return event.properties && event.properties.eventCategory && includes(event.properties.eventCategory, 'split');
            });

            t.equal(sentEvents.length, splitTrackParams.length + customHits.length, 'Number of sent events is equal to custom events plus hits tracked as events');
            t.equal(sentEventsFromSplitToGa.length, 0, 'GA hits comming from Split-to-GA integration must not be tracked again as Split events');

            const sentHitsNoSplitData = window.gaSpy.getHits().filter(hit => !hit.eventCategory || !includes(hit.eventCategory, 'split'));
            const sentHitsSplitEvents = window.gaSpy.getHits().filter(hit => hit.eventCategory === 'split-event');

            t.equal(sentHitsNoSplitData.length, customHits.length, 'Number of custom hits');
            t.equal(sentHitsSplitEvents.length, splitTrackParams.length, 'Number of Split event hits');
            finish.next();
          } catch (err) {
            console.error(err);
          }
        });
      });
      return [200];
    });

    gaTag();

    // siteSpeedSampleRate set to 0 to never send a site speed timing hit
    window.ga('create', 'UA-00000000-1', 'auto', { siteSpeedSampleRate: 0 });

    gaSpy();

    window.ga('require', 'splitTracker');
    customHits.forEach(hit => {
      window.ga('send', hit);
    });

    const factory = SplitFactory({
      ...config,
      startup: {
        eventsFirstPushWindow: 0,
      },
      scheduler: {
        impressionsRefreshRate: 1,
        // @TODO eventsPushRate is too high, but using eventsQueueSize don't let us assert `filterSplitToGaHits`
        eventsPushRate: 10,
        // eventsQueueSize: splitTrackParams.length + customHits.length,
      },
    });
    client = factory.client();

    client.ready().then(() => {
      splitTrackParams.forEach(trackParams => {
        client.track.apply(client, trackParams);
      });
      splitGetTreatmentParams.forEach(getTreatmentParams => {
        client.getTreatment.apply(client, getTreatmentParams);
      });
    });
  });

}