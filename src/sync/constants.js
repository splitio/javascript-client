// time for refresh token
export const SECONDS_BEFORE_EXPIRATION = 600;

// Internal SDK events, subscribed by SyncManager and PushManager
export const PUSH_CONNECT = 'PUSH_CONNECT';
export const PUSH_DISABLED = 'PUSH_DISABLED';
export const PUSH_DISCONNECT = 'PUSH_DISCONNECT';
export const SSE_ERROR = 'SSE_ERROR';

// Update-type push notifications, handled by NotificationProcessor
export const MY_SEGMENTS_UPDATE = 'MY_SEGMENTS_UPDATE';
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
};