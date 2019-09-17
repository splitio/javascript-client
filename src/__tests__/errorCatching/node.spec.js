// Here we are testing exceptions and the handler should be ours, we need to avoid tape-catch
import tape from 'tape';
import includes from 'lodash/includes';
import MockAdapter from 'axios-mock-adapter';

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';
import { __getAxiosInstance } from '../../services/transport';

import splitChangesMock1 from './splitChanges.since.-1.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import splitChangesMock3 from './splitChanges.since.1500492297547.json';

// Set the mock adapter on the current axios instance with a delay of 1.5 seconds.
const mock = new MockAdapter(__getAxiosInstance(), { delayResponse: 1500 });

const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  }
});

mock.onGet(settings.url('/splitChanges?since=-1')).reply(200, splitChangesMock1);
mock.onGet(settings.url('/splitChanges?since=1500492097547')).reply(200, splitChangesMock2);
mock.onGet(settings.url('/splitChanges?since=1500492297547')).reply(200, splitChangesMock3);


tape('Error catching on callbacks', assert => {
  const assertionsPlanned = 3;
  let errCount = 0;
  const factory = SplitFactory({
    core: {
      authorizationKey: '<fake-token-1>'
    },
    startup: {
      eventsFirstPushWindow: 10000,
      readyTimeout: 1
    },
    scheduler: {
      featuresRefreshRate: 2,
      segmentsRefreshRate: 10000,
      metricsRefreshRate: 10000,
      impressionsRefreshRate: 10000,
      eventsPushRate: 10000
    },
    debug: false
  });
  const client = factory.client();

  client.once(client.Event.SDK_READY_TIMED_OUT, () => {
    null.willThrowForTimedOut();
  });

  client.once(client.Event.SDK_READY, () => {
    null.willThrowForReady();
  });

  client.once(client.Event.SDK_UPDATE, () => {
    null.willThrowForUpdate();
  });

  const exceptionHandler = err => {
    if (includes(err.message, 'willThrowFor')) {
      errCount++;
      assert.pass(`But this should be loud, all should throw as Uncaught Exception: ${err.message}`);

      if (errCount === assertionsPlanned) {
        process.off('uncaughException', exceptionHandler);
        client.destroy();
        mock.restore();
        assert.end();
      }
    }
  };

  process.on('uncaughtException', exceptionHandler);
});
