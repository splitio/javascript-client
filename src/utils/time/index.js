const DEDUP_WINDOW_SIZE_MS = 3600*1000;

/**
* Truncates de time frame received with the time window.
*/
export function truncateTimeFrame(timestampInMs) {
  return timestampInMs - (timestampInMs % DEDUP_WINDOW_SIZE_MS);
}
