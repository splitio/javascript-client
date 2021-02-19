import tape from 'tape-catch';
import fetchMock from '../testUtils/fetchMock';
import { testAuthWithPushDisabled, testAuthWith401, testNoEventSource, testNoBase64Support, testSSEWithNonRetryableError } from '../browserSuites/push-initialization-nopush.spec';
import { testPushRetriesDueToAuthErrors, testPushRetriesDueToSseErrors, testSdkDestroyWhileAuthRetries, testSdkDestroyWhileAuthSuccess } from '../browserSuites/push-initialization-retries.spec';
import { testSynchronization } from '../browserSuites/push-synchronization.spec';
import { testSynchronizationRetries } from '../browserSuites/push-synchronization-retries.spec';
import { testFallbacking } from '../browserSuites/push-fallbacking.spec';
import { testRefreshToken } from '../browserSuites/push-refresh-token.spec';

fetchMock.config.overwriteRoutes = false;

tape('## Browser JS - E2E CI Tests for PUSH ##', function (assert) {

  // Non-recoverable issues on inizialization
  assert.test('E2E / PUSH initialization: auth with push disabled', testAuthWithPushDisabled.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: auth with 401', testAuthWith401.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: fallback to polling if EventSource is not available', testNoEventSource.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: fallback to polling if EventSource is not available', testNoBase64Support.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: sse with non-recoverable Ably error', testSSEWithNonRetryableError.bind(null, fetchMock));

  // Recoverable issues on inizialization
  assert.test('E2E / PUSH initialization: auth failures and then success', testPushRetriesDueToAuthErrors.bind(null, fetchMock));
  assert.test('E2E / PUSH initialization: SSE connection failures and then success', testPushRetriesDueToSseErrors.bind(null, fetchMock));

  // Graceful shutdown
  assert.test('E2E / PUSH disconnection: SDK destroyed while authenticating', testSdkDestroyWhileAuthSuccess.bind(null, fetchMock));
  assert.test('E2E / PUSH disconnection: SDK destroyed while auth was retrying', testSdkDestroyWhileAuthRetries.bind(null, fetchMock));

  assert.test('E2E / PUSH synchronization: happy paths', testSynchronization.bind(null, fetchMock));
  assert.test('E2E / PUSH synchronization: retries', testSynchronizationRetries.bind(null, fetchMock));

  assert.test('E2E / PUSH fallbacking', testFallbacking.bind(null, fetchMock));

  assert.test('E2E / PUSH refresh token', testRefreshToken.bind(null, fetchMock));

  assert.end();
});
