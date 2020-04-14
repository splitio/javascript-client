export const PushEventTypes = {
  // high level event types: subscribed by SyncManager and published by PushManager and NotificationProcessor
  PUSH_CONNECT: 'PUSH_CONNECT',
  PUSH_DISCONNECT: 'PUSH_DISCONNECT',
  // event types associated to SSE events
  SPLIT_UPDATE: 'SPLIT_UPDATE',
  SEGMENT_UPDATE: 'SEGMENT_UPDATE',
  MY_SEGMENTS_UPDATE: 'MY_SEGMENTS_UPDATE',
  SPLIT_KILL: 'SPLIT_KILL',
  OCCUPANCY: 'OCCUPANCY',
  error: 'error',
};

export const SECONDS_BEFORE_EXPIRATION = 600;