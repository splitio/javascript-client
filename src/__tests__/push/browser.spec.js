import tape from 'tape-catch';
import fetchMock from '../utils/fetchMock';
import { testAuthWithPushDisabled, testAuthWith401, testNoEventSource, testNoBase64Support } from '../browserSuites/push-initialization-nopush.spec';
import { testAuthRetries, testSSERetries } from '../browserSuites/push-initialization-retries.spec';
import { testSynchronization } from '../browserSuites/push-synchronization.spec';
import { testSynchronizationRetries } from '../browserSuites/push-synchronization-retries.spec';
import { testFallbacking } from '../browserSuites/push-fallbacking.spec';
import { testRefreshToken } from '../browserSuites/push-refresh-token.spec';

fetchMock.config.overwriteRoutes = false;

tape('## Browser JS - E2E CI Tests for PUSH ##', function (assert) {

  assert.test('E2E / PUSH initialization: auth with push disabled', testAuthWithPushDisabled.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: auth with 401', testAuthWith401.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: fallback to polling if EventSource is not available', testNoEventSource.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: fallback to polling if EventSource is not available', testNoBase64Support.bind(null, fetchMock));

  assert.test('E2E / PUSH initialization: auth failures and then success', testAuthRetries.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: SSE connection failures and then success', testSSERetries.bind(null, fetchMock));

  assert.test('E2E / PUSH synchronization: happy paths', testSynchronization.bind(null, fetchMock));
  assert.test('E2E / PUSH synchronization: retries', testSynchronizationRetries.bind(null, fetchMock));

  assert.test('E2E / PUSH fallbacking', testFallbacking.bind(null, fetchMock));

  assert.test('E2E / PUSH refresh token', testRefreshToken.bind(null, fetchMock));

  assert.end();
});
