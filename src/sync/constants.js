// time for refresh token
export const SECONDS_BEFORE_EXPIRATION = 600;

// Internal SDK events, subscribed by SyncManager and PushManager
/**
 * emitted on SSE and Authenticate non-recoverable errors, STREAMING_DISABLED control notification and authentication with pushEnabled false
 * triggers `handleNonRetryableError` call
 */
export const PUSH_NONRETRYABLE_ERROR = 'PUSH_NONRETRYABLE_ERROR';
/**
 * emitted on SSE and Authenticate recoverable errors
 * triggers `handleRetryableError` call
 */
export const PUSH_RETRYABLE_ERROR = 'PUSH_RETRYABLE_ERROR';
/**
 * emitted on STREAMING_RESUMED control notification, OCCUPANCY different than 0, and SSE onopen event
 * triggers `stopPollingAndSyncAll` call
 */
export const PUSH_SUBSYSTEM_UP = 'PUSH_SUBSYSTEM_UP';

/**
 * emitted on STREAMING_PAUSED control notification, OCCUPANCY equal to 0, PUSH_NONRETRYABLE_ERROR and PUSH_RETRYABLE_ERROR events.
 * triggers `startPolling` and `stopWorkers` calls
 */
export const PUSH_SUBSYSTEM_DOWN = 'PUSH_SUBSYSTEM_DOWN';

// Update-type push notifications, handled by NotificationProcessor
export const MY_SEGMENTS_UPDATE = 'MY_SEGMENTS_UPDATE';
export const MY_SEGMENTS_UPDATE_V2 = 'MY_SEGMENTS_UPDATE_V2';
export const SEGMENT_UPDATE = 'SEGMENT_UPDATE';
export const SPLIT_KILL = 'SPLIT_KILL';
export const SPLIT_UPDATE = 'SPLIT_UPDATE';

// Control-type push notifications, handled by NotificationKeeper
export const CONTROL = 'CONTROL';
export const OCCUPANCY = 'OCCUPANCY';

export const ControlTypes = {
  STREAMING_DISABLED: 'STREAMING_DISABLED',
  STREAMING_PAUSED: 'STREAMING_PAUSED',
  STREAMING_RESUMED: 'STREAMING_RESUMED',
  STREAMING_RESET: 'STREAMING_RESET'
};
