// Here we are testing exceptions and the handler should be ours, we need to avoid tape-catch
import { getStorageHash } from '@splitsoftware/splitio-commons/src/storages/KeyBuilder';
import tape from 'tape';
import includes from 'lodash/includes';
import fetchMock from '../testUtils/fetchMock';
import { url } from '../testUtils';
import splitChangesMock1 from '../mocks/splitChanges.since.-1.till.1500492097547.json';
import mySegmentsMock from '../mocks/mySegmentsEmpty.json';
import splitChangesMock2 from '../mocks/splitChanges.since.1500492097547.till.1500492297547.json';
import splitChangesMock3 from '../mocks/splitChanges.since.1500492297547.json';
import { SplitFactory } from '../../';
import { settingsFactory } from '../../settings';

const settings = settingsFactory({
  core: {
    authorizationKey: '<fake-token>'
  },
  streamingEnabled: false
});

// prepare localstorage to emit SDK_READY_FROM_CACHE
localStorage.clear();
localStorage.setItem('SPLITIO.splits.till', 25);
localStorage.setItem('SPLITIO.hash', getStorageHash({ core: { authorizationKey: '<fake-token-1>' }, sync: { __splitFiltersValidation: { queryString: null }, flagSpecVersion: '1.1' } }));

fetchMock.get(url(settings, '/splitChanges?s=1.1&since=25'), function () {
  return new Promise((res) => { setTimeout(() => res({ status: 200, body: splitChangesMock1 }), 1000); });
});
fetchMock.get(url(settings, '/splitChanges?s=1.1&since=1500492097547'), { status: 200, body: splitChangesMock2 });
fetchMock.get(url(settings, '/splitChanges?s=1.1&since=1500492297547'), { status: 200, body: splitChangesMock3 });
fetchMock.get(url(settings, '/mySegments/nico%40split.io'), { status: 200, body: mySegmentsMock });
fetchMock.post('*', 200);

const assertionsPlanned = 4;
let errCount = 0;

tape('Error catching on callbacks - Browsers', assert => {
  let previousErrorHandler = window.onerror || null;

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
      telemetryRefreshRate: 100000,
      impressionsRefreshRate: 100000,
      eventsPushRate: 100000
    },
    storage: {
      type: 'LOCALSTORAGE',
      // Using default prefix 'SPLITIO'
    },
    streamingEnabled: false
  });

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
    assert.true(client.__getStatus().hasTimedout); // SDK status should be already updated
    attachErrorHandlerIfApplicable();
    null.willThrowForTimedOut();
  });

  client.once(client.Event.SDK_READY, () => {
    assert.true(client.__getStatus().isReady); // SDK status should be already updated
    attachErrorHandlerIfApplicable();
    null.willThrowForReady();
  });

  client.once(client.Event.SDK_UPDATE, () => {
    attachErrorHandlerIfApplicable();
    null.willThrowForUpdate();
  });

  client.once(client.Event.SDK_READY_FROM_CACHE, () => {
    assert.true(client.__getStatus().isReadyFromCache); // SDK status should be already updated
    attachErrorHandlerIfApplicable();
    null.willThrowForReadyFromCache();
  });

  attachErrorHandlerIfApplicable();
});
