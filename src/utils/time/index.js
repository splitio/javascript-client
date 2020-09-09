const TIME_INTERVAL_MS = 3600*1000;

export function truncateTimeFrame(timestampInMs) {
  return timestampInMs - (timestampInMs % TIME_INTERVAL_MS);
}
