export const Types = {
  SPLIT_UPDATE: 'SPLIT_UPDATE',
  SEGMENT_UPDATE: 'SEGMENT_UPDATE',
  MYSEGMENT_UPDATE: 'MY_SEGMENT_UPDATE',
  SPLIT_KILL: 'SPLIT_KILL',
  STREAMING_DOWN: 'STREAMING_DOWN',
  STREAMING_UP: 'STREAMING_UP',
  RECONNECT: 'RECONNECT',
};

export function errorParser(error) {
  // @TODO
  error;
  return { type: Types.STREAMING_DOWN };
}

export function messageParser(message) {
  // @TODO
  message;
  return { type: Types.SPLIT_UPDATE, changeNumber: 111111 };
}