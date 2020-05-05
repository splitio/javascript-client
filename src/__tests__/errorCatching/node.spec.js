// Here we are testing exceptions and the handler should be ours, we need to avoid tape-catch
import tape from 'tape';
import includes from 'lodash/includes';
import fetchMock from 'fetch-mock';

import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

import splitChangesMock1 from './splitChanges.since.-1.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import splitChangesMock3 from './splitChanges.since.1500492297547.json';

// config the fetch mock to chain routes (appends the new route to the list of routes)
fetchMock.config.overwriteRoutes = false;
// Option object used to configure mocked routes with a delay of 1.5 seconds.
const responseDelay = { delay: 1500 };

const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  }
});

fetchMock.get(settings.url('/splitChanges?since=-1'), { status: 200, body: splitChangesMock1 }, responseDelay);
fetchMock.get(settings.url('/splitChanges?since=1500492097547'), { status: 200, body: splitChangesMock2 }, responseDelay);
fetchMock.get(settings.url('/splitChanges?since=1500492297547'), { status: 200, body: splitChangesMock3 }, responseDelay);


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
        fetchMock.restore();
        assert.end();
      }
    }
  };

  process.on('uncaughtException', exceptionHandler);
});
