// Here we are testing exceptions and the handler should be ours, we need to avoid tape-catch
import tape from 'tape';
import includes from 'lodash/includes';
import fetchMock from '../testUtils/fetchMock';
import splitChangesMock1 from './splitChanges.since.-1.json';
import mySegmentsMock from './mySegments.nico@split.io.json';
import splitChangesMock2 from './splitChanges.since.1500492097547.json';
import splitChangesMock3 from './splitChanges.since.1500492297547.json';
import { SplitFactory } from '../../';
import SettingsFactory from '../../utils/settings';

const settings = SettingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  },
  streamingEnabled: false
});

fetchMock.get(settings.url('/splitChanges?since=-1'), function () {
  return new Promise((res) => { setTimeout(() => res({ status: 200, body: splitChangesMock1 }), 1000); });
});
fetchMock.get(settings.url('/splitChanges?since=1500492097547'), { status: 200, body: splitChangesMock2 });
fetchMock.get(settings.url('/splitChanges?since=1500492297547'), { status: 200, body: splitChangesMock3 });
fetchMock.get(settings.url('/mySegments/nico@split.io'), { status: 200, body: mySegmentsMock });
fetchMock.post('*', 200);

const assertionsPlanned = 3;
let errCount = 0;
const factory = SplitFactory({
  core: {
    authorizationKey: '<fake-token-1>',
    key: 'nico@split.io'
  },
  startup: {
    eventsFirstPushWindow: 100000,
    readyTimeout: 0.5,
    requestTimeoutBeforeReady: 100000
  },
  scheduler: {
    featuresRefreshRate: 1.5,
    segmentsRefreshRate: 100000,
    metricsRefreshRate: 100000,
    impressionsRefreshRate: 100000,
    eventsPushRate: 100000
  },
  streamingEnabled: false
});

tape('Error catching on callbacks - Browsers', assert => {
  let previousErrorHandler = window.onerror || null;
  const client = factory.client();

  const exceptionHandler = err => {
    if (includes(err, 'willThrowFor')) {
      errCount++;
      assert.pass(`But this should be loud, all should throw as Uncaught Exception: ${err}`);

      if (errCount === assertionsPlanned) {
        const wrapUp = () => {
          window.onerror = previousErrorHandler;
          fetchMock.restore();
          assert.end();
        };

        client.destroy().then(wrapUp).catch(wrapUp);
      }
      return true;
    }
    assert.fail(err);
    return false;
  };
  // Karma is missbehaving and overwriting our custom error handler on some scenarios.
  function attachErrorHandlerIfApplicable() {
    if (window.onerror !== exceptionHandler) {
      previousErrorHandler = window.onerror;
      window.onerror = exceptionHandler;
    }
  }

  client.on(client.Event.SDK_READY_TIMED_OUT, () => {
    attachErrorHandlerIfApplicable();
    null.willThrowForTimedOut();
  });

  client.once(client.Event.SDK_READY, () => {
    attachErrorHandlerIfApplicable();
    null.willThrowForReady();
  });

  client.once(client.Event.SDK_UPDATE, () => {
    attachErrorHandlerIfApplicable();
    null.willThrowForUpdate();
  });

  attachErrorHandlerIfApplicable();
});
