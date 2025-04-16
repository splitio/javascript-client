import { SplitFactory } from '../../';
import splitChangesMockReal from '../mocks/splitchanges.real.json';
import authPushDisabled from '../mocks/auth.pushDisabled.json';
import { nearlyEqual, url } from '../testUtils';

const config = {
  core: {
    authorizationKey: '<fake-token-1>'
  },
  scheduler: {
    featuresRefreshRate: 0.5,
  },
  urls: {
    sdk: 'https://outdated-proxy/api',
    auth: 'https://outdated-proxy/api',
  }
};

// Response mocks
const outdatedProxyFailResponse = {
  status: 400
};
const outdatedProxyInitialResponse = {
  status: 200, body: {
    splits: splitChangesMockReal.ff.d,
    since: splitChangesMockReal.ff.s,
    till: splitChangesMockReal.ff.t
  }
};
const outdatedProxyNextResponse = {
  status: 200, body: {
    splits: [],
    since: 1457552620999,
    till: 1457552620999
  }
};
const fixedProxyInitialResponse = {
  status: 200, body: splitChangesMockReal
};
const fixedProxyNextResponse = {
  status: 200, body: {
    ff: {
      d: [],
      s: 1457552620999,
      t: 1457552620999
    }
  }
};

export async function proxyFallbackSuite(fetchMock, assert) {
  const originalDateNow = Date.now;
  const start = originalDateNow();

  fetchMock.getOnce(url(config, '/v2/auth?s=1.2'), { status: 200, body: authPushDisabled });

  // Outdated Proxy responds with 400 when spec 1.3 is provided
  fetchMock.getOnce(url(config, '/splitChanges?s=1.3&since=-1&rbSince=-1'), outdatedProxyFailResponse);

  // Fallback to spec 1.2
  fetchMock.getOnce(url(config, '/splitChanges?s=1.2&since=-1'), () => {
    assert.true(nearlyEqual(originalDateNow(), start), 'Initial fallback to spec 1.2');
    return outdatedProxyInitialResponse;
  });
  fetchMock.getOnce(url(config, '/splitChanges?s=1.2&since=1457552620999'), () => {
    assert.true(nearlyEqual(originalDateNow(), start), 'Initial fallback to spec 1.2');
    return outdatedProxyNextResponse;
  });

  // Polling with fallback to spec 1.2
  fetchMock.getOnce(url(config, '/splitChanges?s=1.2&since=1457552620999'), () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 1000), 'First polling with fallback to spec 1.2');

    // Mock Date.now() to return a +24h timestamp to force a proxy recheck
    let lastTimestamp = originalDateNow();
    Date.now = () => lastTimestamp += 25 * 60 * 60 * 1000;

    return outdatedProxyNextResponse;
  });

  // Polling with proxy recheck using spec 1.3, but fail again
  fetchMock.getOnce(url(config, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 2000), 'Second polling with recheck');

    return outdatedProxyFailResponse;
  });
  // Fallback to spec 1.2
  fetchMock.getOnce(url(config, '/splitChanges?s=1.2&since=1457552620999'), () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 2000), 'Second polling with fallback to spec 1.2');

    return outdatedProxyNextResponse;
  });

  // Polling with proxy recheck using spec 1.3. This time succeeds
  fetchMock.getOnce(url(config, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 3000), 'Third polling with recheck');

    return fixedProxyNextResponse;
  });
  // Proxy recovery: refetch with clear cache
  fetchMock.getOnce(url(config, '/splitChanges?s=1.3&since=-1&rbSince=-1'), () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 3000), 'Proxy recovery: refetch with clear cache');

    return fixedProxyInitialResponse;
  });

  // Polling with spec 1.3
  fetchMock.getOnce(url(config, '/splitChanges?s=1.3&since=1457552620999&rbSince=-1'), () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 4000), 'Fourth polling with spec 1.3');

    return fixedProxyNextResponse;
  });

  const splitio = SplitFactory(config);
  const client = splitio.client();
  const manager = splitio.manager();

  client.once(client.Event.SDK_READY, () => {
    assert.equal(manager.splits().length, splitChangesMockReal.ff.d.length, 'SDK IS READY as it should. The manager.splits() method should return all feature flags.');
  });

  client.once(client.Event.SDK_READY_TIMED_OUT, () => {
    assert.fail('SDK TIMED OUT - It should not in this scenario');
    assert.end();
  });

  client.once(client.Event.SDK_UPDATE, () => {
    assert.true(nearlyEqual(originalDateNow() - start, config.scheduler.featuresRefreshRate * 3000), 'Proxy recovery: refetch with clear cache and spec 1.3 trigger an SDK_UPDATE event');
    assert.equal(manager.splits().length, splitChangesMockReal.ff.d.length, 'Validate that the SDK is operational after proxy recovery');
  });

  // Wait for 4 feature refreshes
  await new Promise(resolve => setTimeout(resolve, config.scheduler.featuresRefreshRate * 1000 * 4 + 200));
  await client.destroy();
  assert.end();
}
