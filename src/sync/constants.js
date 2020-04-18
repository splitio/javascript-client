export const PushEventTypes = {
  // high level event types: subscribed by SyncManager and published by PushManager and NotificationManagerKeeper
  PUSH_CONNECT: 'PUSH_CONNECT',
  PUSH_DISCONNECT: 'PUSH_DISCONNECT',
  // UPDATE-type events associated to SSE events
  SPLIT_UPDATE: 'SPLIT_UPDATE',
  SEGMENT_UPDATE: 'SEGMENT_UPDATE',
  MY_SEGMENTS_UPDATE: 'MY_SEGMENTS_UPDATE',
  SPLIT_KILL: 'SPLIT_KILL',
  //
  OCCUPANCY: 'OCCUPANCY',
  CONTROL: 'CONTROL',
  //
  SSE_ERROR: 'SSE_ERROR',
  PUSH_DISABLED: 'PUSH_DISABLED',
};

export const SECONDS_BEFORE_EXPIRATION = 600;

export const ControlTypes = {
  STREAMING_PAUSED: 'STREAMING_PAUSED',
  STREAMING_RESUMED: 'STREAMING_RESUMED',
  STREAMING_DISABLED: 'STREAMING_DISABLED',
};