export function getEventSource() {
  return typeof EventSource === 'function' ? EventSource : undefined;
}
