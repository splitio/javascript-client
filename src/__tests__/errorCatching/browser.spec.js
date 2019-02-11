// Here we are testing exceptions and the handler should be ours, we need to avoid tape-catch
import tape from 'tape';
import axios from 'axios';
import includes from 'lodash/includes';
import MockAdapter from 'axios-mock-adapter';
import splitChangesMock1 from './splitchanges.since.-1.json';
import mySegmentsMock from './mySegments.nico@split.io.json';
import splitChangesMock2 from './splitchanges.since.1500492097547.json';
import splitChangesMock3 from './splitchanges.since.1500492297547.json';

// Set the mock adapter on the default instance with a delay of 1.5 seconds.
const mock = new MockAdapter(axios, { delayResponse: 1500 });

import SettingsFactory from '../../utils/settings';
const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  }
});

mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
mock.onGet(settings.url('/splitChanges?since=1500492097547')).reply(200, splitChangesMock2);
mock.onGet(settings.url('/splitChanges?since=1500492297547')).reply(200, splitChangesMock3);
mock.onGet(settings.url('/mySegments/nico@split.io')).reply(200, mySegmentsMock);

import { SplitFactory } from '../../';
const assertionsPlanned = 3;
let errCount = 0;
const factory = SplitFactory({
  core: {
    authorizationKey: '<fake-token-1>',
    key: 'nico@split.io'
  },
  startup: {
    eventsFirstPushWindow: 100000,
    readyTimeout: 1.4,
    requestTimeoutBeforeReady: 100000
  },
  scheduler: {
    featuresRefreshRate: 3,
    segmentsRefreshRate: 100000,
    metricsRefreshRate: 100000,
    impressionsRefreshRate: 100000,
    eventsPushRate: 100000
  }
});

tape('Error catching on callbacks - Browsers', assert => {
  const client = factory.client();

  client.on(client.Event.SDK_READY_TIMED_OUT, () => {
    null.willThrowForTimedOut();
  });

  client.once(client.Event.SDK_READY, () => {
    null.willThrowForReady();
  });

  client.once(client.Event.SDK_UPDATE, () => {
    null.willThrowForUpdate();
  });
  const previousErrorHandler = window.onerror || null;

  const exceptionHandler = err => {
    if (includes(err, 'willThrowFor')) {
      errCount++;
      assert.pass(`But this should be loud, all should throw as Uncaught Exception: ${err}`);

      if (errCount === assertionsPlanned) {
        client.destroy();
        window.onerror = previousErrorHandler;

        assert.end();
      }
      return true;
    }
    assert.fail(err);
    return false;
  };

  window.onerror = exceptionHandler;
});
