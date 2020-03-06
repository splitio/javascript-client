export const Types = {
  SPLIT_KILL: 'SPLIT_KILL',
  SPLIT_UPDATE: 'SPLIT_UPDATE',
  SEGMENT_UPDATE: 'SEGMENT_UPDATE',
  MYSEGMENT_UPDATE: 'MY_SEGMENT_UPDATE',
  STREAMING_DOWN: 'STREAMING_DOWN',
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