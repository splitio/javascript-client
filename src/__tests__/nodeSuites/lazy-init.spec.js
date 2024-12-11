import { SplitFactory as SplitFactorySS } from '../../factory/node';
import { SplitFactory as SplitFactoryCS } from '../../factory/browser';

// Tests should finish without dangling timers or requests
export default function (settings, fetchMock, t) {

  t.test('Server-side', async (assert) => {
    let splitio;

    for (let i = 0; i < 100; i++) {
      splitio = SplitFactorySS({
        core: {
          authorizationKey: 'fake-token-' + i,
        },
        urls: {
          sdk: 'https://not-called/api',
          events: 'https://not-called/api',
          auth: 'https://not-called/api',
        }
      }, (modules) => {
        modules.lazyInit = true;
      });

      const manager = splitio.manager();
      assert.deepEqual(manager.names(), [], 'We should not have done any request yet');

      const client = splitio.client();
      assert.equal(client.getTreatment('user-1', 'split_test'), 'control', 'We should get control');
      assert.equal(client.track('user-1', 'user', 'my_event'), true, 'We should track the event');
    }

    fetchMock.getOnce('https://not-called/api/splitChanges?s=1.1&since=-1', { status: 200, body: { splits: [], since: -1, till: 1457552620999 } });
    fetchMock.getOnce('https://not-called/api/splitChanges?s=1.1&since=1457552620999', { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
    fetchMock.postOnce('https://not-called/api/testImpressions/bulk', 200);
    fetchMock.postOnce('https://not-called/api/events/bulk', 200);
    fetchMock.get('https://not-called/api/v2/auth?s=1.1', 200);

    // Validate that init and destroy are idempotent
    for (let i = 0; i < 3; i++) { splitio.init(); splitio.init(); splitio.destroy(); splitio.destroy(); }

    splitio.init();
    await splitio.client().ready();

    assert.deepEqual(splitio.client().__getStatus(), { isReady: true, isReadyFromCache: false, isTimedout: false, hasTimedout: false, isDestroyed: false, isOperational: true, lastUpdate: splitio.client().__getStatus().lastUpdate }, 'Status');

    await splitio.destroy();
    assert.deepEqual(splitio.client().__getStatus(), { isReady: true, isReadyFromCache: false, isTimedout: false, hasTimedout: false, isDestroyed: true, isOperational: false, lastUpdate: splitio.client().__getStatus().lastUpdate }, 'Status');

    splitio.init();

    assert.deepEqual(splitio.client().__getStatus(), { isReady: true, isReadyFromCache: false, isTimedout: false, hasTimedout: false, isDestroyed: false, isOperational: true, lastUpdate: splitio.client().__getStatus().lastUpdate }, 'Status');

    await splitio.destroy();

    assert.end();
  });

  t.test('Client-side', async (assert) => {
    let splitio;

    for (let i = 0; i < 100; i++) {
      splitio = SplitFactoryCS({
        core: {
          authorizationKey: 'fake-token-' + i,
          key: 'user-' + i,
        },
        urls: {
          sdk: 'https://not-called/api',
          events: 'https://not-called/api',
          auth: 'https://not-called/api',
        }
      }, (modules) => {
        modules.lazyInit = true;
      });

      const manager = splitio.manager();
      assert.deepEqual(manager.names(), [], 'We should not have done any request yet');

      const client = splitio.client();
      assert.equal(client.getTreatment('split_test'), 'control', 'We should get control');
      assert.equal(client.track('user', 'my_event'), true, 'We should track the event');

      const otherClient = splitio.client('other-user');
      assert.equal(otherClient.getTreatment('split_test'), 'control', 'We should get control');
      assert.equal(otherClient.track('user', 'my_event'), true, 'We should track the event');
    }

    fetchMock.getOnce('https://not-called/api/splitChanges?s=1.2&since=-1', { status: 200, body: { splits: [], since: -1, till: 1457552620999 } });
    fetchMock.getOnce('https://not-called/api/splitChanges?s=1.2&since=1457552620999', { status: 200, body: { splits: [], since: 1457552620999, till: 1457552620999 } });
    fetchMock.getOnce('https://not-called/api/memberships/user-99', { status: 200, body: {} });
    fetchMock.getOnce('https://not-called/api/memberships/other-user', { status: 200, body: {} });
    fetchMock.postOnce('https://not-called/api/testImpressions/bulk', 200);
    fetchMock.postOnce('https://not-called/api/events/bulk', 200);
    fetchMock.get('https://not-called/api/v2/auth?s=1.2&users=user-99', 200);

    // Validate that init and destroy are idempotent
    for (let i = 0; i < 3; i++) { splitio.init(); splitio.init(); splitio.destroy(); splitio.destroy(); }

    splitio.init();
    await splitio.client().ready();

    assert.deepEqual(splitio.client().__getStatus(), { isReady: true, isReadyFromCache: false, isTimedout: false, hasTimedout: false, isDestroyed: false, isOperational: true, lastUpdate: splitio.client().__getStatus().lastUpdate }, 'Status');

    await splitio.destroy();
    assert.deepEqual(splitio.client().__getStatus(), { isReady: true, isReadyFromCache: false, isTimedout: false, hasTimedout: false, isDestroyed: true, isOperational: false, lastUpdate: splitio.client().__getStatus().lastUpdate }, 'Status');

    splitio.init();

    assert.deepEqual(splitio.client().__getStatus(), { isReady: true, isReadyFromCache: false, isTimedout: false, hasTimedout: false, isDestroyed: false, isOperational: true, lastUpdate: splitio.client().__getStatus().lastUpdate }, 'Status');

    await splitio.destroy();

    assert.end();
  });
}
