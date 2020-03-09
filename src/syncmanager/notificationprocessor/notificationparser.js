export const Types = {
  SPLIT_UPDATE: 'SPLIT_UPDATE',
  SEGMENT_UPDATE: 'SEGMENT_UPDATE',
  MY_SEGMENTS_UPDATE: 'MY_SEGMENTS_UPDATE',
  SPLIT_KILL: 'SPLIT_KILL',
  STREAMING_DOWN: 'STREAMING_DOWN',
  STREAMING_UP: 'STREAMING_UP',
  RECONNECT: 'RECONNECT',
};

export function errorParser(error) {
  const data = JSON.parse(error.data);
  return data;
}

export function messageParser(message) {
  const data = JSON.parse(message.data);
  return data;
}